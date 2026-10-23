import 'package:flutter/foundation.dart';

import '../data/api/api_cliente.dart';
import '../data/api/chat_api.dart';
import '../data/api/modelos.dart';
import '../data/local/almacen_local.dart';
import '../data/local/cola_sincronizacion.dart';

/// Gestor del chat con el AI Assistant (RF-01).
///
/// Reglas de la Práctica 1 que se respetan aquí:
///  * mensajes breves (se recortan a [ChatApi.maxCaracteres]);
///  * respuestas legibles en pantalla pequeña (el modelo ya responde corto, y
///    la vista parte el texto en varias líneas);
///  * el estado "escribiendo" es real: se muestra mientras la petición está en
///    vuelo, porque el backend no hace streaming.
///
/// Sin conexión el mensaje **no se pierde**: se guarda como pendiente, se
/// encola y se reintenta al volver la red.
class ChatManager extends ChangeNotifier {
  ChatManager({
    required ChatApi api,
    required AlmacenLocal almacen,
    required ColaSincronizacion cola,
  }) : _api = api,
       _almacen = almacen,
       _cola = cola;

  final ChatApi _api;
  final AlmacenLocal _almacen;
  final ColaSincronizacion _cola;

  static const String claveConversacion = 'chat_conversacion';

  /// "Se guardan pocas": sólo los últimos mensajes quedan en el reloj.
  static const int maxMensajesGuardados = 20;

  final List<MensajeChat> _mensajes = <MensajeChat>[];
  bool _enviando = false;
  bool _sinConexion = false;
  String? _error;
  int? _conversacionId;
  bool _descartado = false;

  List<MensajeChat> get mensajes => List<MensajeChat>.unmodifiable(_mensajes);
  bool get enviando => _enviando;
  bool get sinConexion => _sinConexion;
  String? get error => _error;
  int? get conversacionId => _conversacionId;
  bool get vacio => _mensajes.isEmpty;

  /// Carga el historial local (cifrado en disco) al abrir el chat.
  Future<void> cargar() async {
    final guardados = await _almacen.mensajes();
    _mensajes
      ..clear()
      ..addAll(guardados);

    final cache = await _almacen.leerCache(claveConversacion);
    final id = cache?['conversacion_id'];
    _conversacionId = id is num ? id.toInt() : null;

    _avisar();
  }

  Future<void> enviar(String texto) async {
    final limpio = texto.trim();
    if (limpio.isEmpty || _enviando) return;

    _error = null;

    // 1) El mensaje del usuario aparece de inmediato.
    final idLocal = await _almacen.agregarMensaje(
      MensajeChat(
        id: 0,
        role: 'user',
        texto: limpio,
        fecha: DateTime.now(),
      ),
    );

    _mensajes.add(
      MensajeChat(
        id: idLocal,
        role: 'user',
        texto: limpio,
        fecha: DateTime.now(),
        local: true,
      ),
    );

    _enviando = true;
    _avisar();

    try {
      final respuesta = await _api.enviarMensaje(
        limpio,
        conversacionId: _conversacionId,
      );

      _conversacionId = respuesta.conversacionId;
      await _almacen.guardarCache(claveConversacion, <String, dynamic>{
        'conversacion_id': respuesta.conversacionId,
      });

      await _guardarRespuesta(respuesta.respuesta);
      _sinConexion = false;
    } on ApiExcepcion catch (e) {
      if (e.esRed) {
        // Sin conexión: queda pendiente y se reintenta al reconectar.
        await _almacen.actualizarEstadoMensaje(idLocal, EstadoMensaje.pendiente);
        await _cola.encolarMensaje(
          idLocal: idLocal,
          texto: limpio,
          conversacionId: _conversacionId,
        );
        _marcarEstado(idLocal, EstadoMensaje.pendiente);
        _sinConexion = true;
      } else {
        _error = e.mensaje;
        await _almacen.actualizarEstadoMensaje(idLocal, EstadoMensaje.error);
        _marcarEstado(idLocal, EstadoMensaje.error);
      }
    } finally {
      _enviando = false;
      await _recortar();
      _avisar();
    }
  }

  Future<void> _guardarRespuesta(String texto) async {
    if (texto.trim().isEmpty) return;

    final idLocal = await _almacen.agregarMensaje(
      MensajeChat(
        id: 0,
        role: 'assistant',
        texto: texto,
        fecha: DateTime.now(),
      ),
    );

    _mensajes.add(
      MensajeChat(
        id: idLocal,
        role: 'assistant',
        texto: texto,
        fecha: DateTime.now(),
        local: true,
      ),
    );
  }

  void _marcarEstado(int idLocal, EstadoMensaje estado) {
    for (var i = 0; i < _mensajes.length; i++) {
      if (_mensajes[i].id == idLocal) {
        _mensajes[i] = _mensajes[i].copiarCon(estado: estado);
      }
    }
  }

  /// Reenvía los mensajes que quedaron pendientes. Devuelve cuántos salieron.
  Future<int> sincronizar() async {
    final pendientes = await _cola.mensajesPendientes();
    if (pendientes.isEmpty) return 0;

    var enviados = 0;

    for (final item in pendientes) {
      final texto = item.payload['texto']?.toString();
      final idLocal = item.payload['id_local'];

      if (texto == null || texto.trim().isEmpty) {
        await _cola.descartar(item.id);
        continue;
      }

      try {
        final respuesta = await _api.enviarMensaje(
          texto,
          conversacionId: _conversacionId,
        );

        _conversacionId = respuesta.conversacionId;
        await _almacen.guardarCache(claveConversacion, <String, dynamic>{
          'conversacion_id': respuesta.conversacionId,
        });

        if (idLocal is num) {
          await _almacen.actualizarEstadoMensaje(
            idLocal.toInt(),
            EstadoMensaje.enviado,
          );
          _marcarEstado(idLocal.toInt(), EstadoMensaje.enviado);
        }

        await _guardarRespuesta(respuesta.respuesta);
        await _cola.descartar(item.id);
        enviados++;
      } on ApiExcepcion catch (e) {
        if (e.esRed) break; // sigue sin red
        // Rechazado por el servidor: se marca y se saca de la cola.
        if (idLocal is num) {
          await _almacen.actualizarEstadoMensaje(
            idLocal.toInt(),
            EstadoMensaje.error,
          );
          _marcarEstado(idLocal.toInt(), EstadoMensaje.error);
        }
        await _cola.descartar(item.id);
      }
    }

    if (enviados > 0) _sinConexion = false;
    await _recortar();
    _avisar();
    return enviados;
  }

  Future<void> _recortar() async {
    await _almacen.recortarMensajes(maxMensajesGuardados);
    if (_mensajes.length > maxMensajesGuardados) {
      _mensajes.removeRange(0, _mensajes.length - maxMensajesGuardados);
    }
  }

  Future<void> limpiar() async {
    await _almacen.limpiarMensajes();
    _mensajes.clear();
    _conversacionId = null;
    _error = null;
    _avisar();
  }

  void limpiarError() {
    if (_error == null) return;
    _error = null;
    _avisar();
  }

  void _avisar() {
    if (_descartado) return;
    notifyListeners();
  }

  @override
  void dispose() {
    _descartado = true;
    super.dispose();
  }
}
