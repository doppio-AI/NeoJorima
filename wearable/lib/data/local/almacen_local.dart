import '../api/modelos.dart';
import '../../services/cifrado_local.dart';

/// Tipos de operación que pueden esperar en la cola de sincronización.
///
/// Los nombres son internos de la app, no de la API: sirven para saber cómo
/// reintentar cada pendiente cuando vuelve la red.
class TipoCola {
  TipoCola._();

  static const String mensajeChat = 'mensaje_chat';
  static const String checkInAnimo = 'checkin_animo';
  static const String sesionRelajacion = 'sesion_relajacion';
}

/// Una operación pendiente de enviar al servidor.
class ItemCola {
  const ItemCola({
    required this.id,
    required this.tipo,
    required this.payload,
    required this.creado,
  });

  final int id;
  final String tipo;
  final Map<String, dynamic> payload;
  final DateTime creado;
}

/// Contrato de la base local del reloj.
///
/// Existe como interfaz para poder probar los gestores de estado sin un
/// dispositivo: en producción se usa [AlmacenSqflite] y en las pruebas
/// [AlmacenMemoria], y los dos se comportan igual para el resto de la app.
abstract class AlmacenLocal {
  // ── Caché de datos remotos (racha, catálogo, perfil) ──
  Future<Map<String, dynamic>?> leerCache(String clave);
  Future<void> guardarCache(String clave, Map<String, dynamic> valor);

  // ── Mensajes del chat ──
  Future<List<MensajeChat>> mensajes();
  Future<int> agregarMensaje(MensajeChat mensaje);
  Future<void> actualizarEstadoMensaje(int idLocal, EstadoMensaje estado);
  Future<void> recortarMensajes(int conservar);
  Future<void> limpiarMensajes();

  // ── Cola de sincronización ──
  Future<int> encolar(String tipo, Map<String, dynamic> payload);
  Future<List<ItemCola>> pendientesPorTipo(String tipo);
  Future<int> totalEnCola();
  Future<void> borrarDeCola(int id);
  Future<void> limpiarCola();

  Future<void> cerrar();
}

/// Implementación en memoria. Se usa en pruebas y como respaldo si la base de
/// datos no se puede abrir.
class AlmacenMemoria implements AlmacenLocal {
  AlmacenMemoria();

  final Map<String, Map<String, dynamic>> _cache = <String, Map<String, dynamic>>{};
  final List<MensajeChat> _mensajes = <MensajeChat>[];
  final List<ItemCola> _cola = <ItemCola>[];

  int _siguienteMensaje = 1;
  int _siguienteCola = 1;

  @override
  Future<Map<String, dynamic>?> leerCache(String clave) async => _cache[clave];

  @override
  Future<void> guardarCache(String clave, Map<String, dynamic> valor) async {
    _cache[clave] = valor;
  }

  @override
  Future<List<MensajeChat>> mensajes() async =>
      List<MensajeChat>.unmodifiable(_mensajes);

  @override
  Future<int> agregarMensaje(MensajeChat mensaje) async {
    final id = _siguienteMensaje++;
    _mensajes.add(mensaje.copiarCon(id: id, local: true));
    return id;
  }

  @override
  Future<void> actualizarEstadoMensaje(int idLocal, EstadoMensaje estado) async {
    for (var i = 0; i < _mensajes.length; i++) {
      if (_mensajes[i].id == idLocal) {
        _mensajes[i] = _mensajes[i].copiarCon(estado: estado);
      }
    }
  }

  @override
  Future<void> recortarMensajes(int conservar) async {
    if (_mensajes.length <= conservar) return;
    _mensajes.removeRange(0, _mensajes.length - conservar);
  }

  @override
  Future<void> limpiarMensajes() async {
    _mensajes.clear();
  }

  @override
  Future<int> encolar(String tipo, Map<String, dynamic> payload) async {
    final id = _siguienteCola++;
    _cola.add(
      ItemCola(
        id: id,
        tipo: tipo,
        payload: Map<String, dynamic>.from(payload),
        creado: DateTime.now(),
      ),
    );
    return id;
  }

  @override
  Future<List<ItemCola>> pendientesPorTipo(String tipo) async =>
      _cola.where((item) => item.tipo == tipo).toList();

  @override
  Future<int> totalEnCola() async => _cola.length;

  @override
  Future<void> borrarDeCola(int id) async {
    _cola.removeWhere((item) => item.id == id);
  }

  @override
  Future<void> limpiarCola() async {
    _cola.clear();
  }

  @override
  Future<void> cerrar() async {}
}

/// Decorador que cifra el texto de los mensajes antes de guardarlo.
///
/// Se aplica sobre el almacén real, así la base de datos del reloj nunca ve el
/// texto plano de una conversación. En las pruebas el mismo decorador se aplica
/// sobre [AlmacenMemoria], de modo que el requisito de cifrado se verifica de
/// verdad y no sólo en el dispositivo.
class AlmacenCifrado implements AlmacenLocal {
  AlmacenCifrado(this._interno, this._cifrado);

  final AlmacenLocal _interno;
  final CifradoLocal _cifrado;

  @override
  Future<int> agregarMensaje(MensajeChat mensaje) async {
    final cifrado = await _cifrado.cifrar(mensaje.texto);
    return _interno.agregarMensaje(mensaje.copiarCon(texto: cifrado));
  }

  @override
  Future<List<MensajeChat>> mensajes() async {
    final guardados = await _interno.mensajes();
    final salida = <MensajeChat>[];
    for (final mensaje in guardados) {
      salida.add(mensaje.copiarCon(texto: await _cifrado.descifrar(mensaje.texto)));
    }
    return salida;
  }

  @override
  Future<Map<String, dynamic>?> leerCache(String clave) => _interno.leerCache(clave);

  @override
  Future<void> guardarCache(String clave, Map<String, dynamic> valor) =>
      _interno.guardarCache(clave, valor);

  @override
  Future<void> actualizarEstadoMensaje(int idLocal, EstadoMensaje estado) =>
      _interno.actualizarEstadoMensaje(idLocal, estado);

  @override
  Future<void> recortarMensajes(int conservar) => _interno.recortarMensajes(conservar);

  @override
  Future<void> limpiarMensajes() => _interno.limpiarMensajes();

  @override
  Future<int> encolar(String tipo, Map<String, dynamic> payload) =>
      _interno.encolar(tipo, payload);

  @override
  Future<List<ItemCola>> pendientesPorTipo(String tipo) =>
      _interno.pendientesPorTipo(tipo);

  @override
  Future<int> totalEnCola() => _interno.totalEnCola();

  @override
  Future<void> borrarDeCola(int id) => _interno.borrarDeCola(id);

  @override
  Future<void> limpiarCola() => _interno.limpiarCola();

  @override
  Future<void> cerrar() => _interno.cerrar();
}
