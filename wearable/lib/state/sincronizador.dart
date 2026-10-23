import 'dart:async';

import 'package:flutter/foundation.dart';

import '../services/conectividad.dart';
import 'chat_manager.dart';
import 'routine_scheduler.dart';
import 'streak_manager.dart';

/// Coordina los tres gestores cuando vuelve la conexión.
///
/// La Práctica 2 lo describe así: "al reconectar se sincroniza y el servidor
/// corrige diferencias". Este es el punto único donde eso ocurre, para que el
/// orden sea siempre el mismo y no haya dos sincronizaciones a la vez.
class Sincronizador extends ChangeNotifier {
  Sincronizador({
    required ChatManager chat,
    required StreakManager racha,
    required RoutineScheduler rutinas,
    required ServicioConectividad conectividad,
  }) : _chat = chat,
       _racha = racha,
       _rutinas = rutinas,
       _conectividad = conectividad;

  final ChatManager _chat;
  final StreakManager _racha;
  final RoutineScheduler _rutinas;
  final ServicioConectividad _conectividad;

  StreamSubscription<bool>? _suscripcion;
  bool _sincronizando = false;
  int _ultimaSincronizacion = 0;
  bool _descartado = false;

  bool get sincronizando => _sincronizando;
  int get ultimaSincronizacion => _ultimaSincronizacion;
  bool get enLinea => _conectividad.enLinea;

  /// Escucha los cambios de red y sincroniza al recuperar la conexión.
  Future<void> iniciar() async {
    await _conectividad.iniciar();

    _suscripcion ??= _conectividad.cambios.listen((enLinea) {
      if (enLinea) unawaited(sincronizarTodo());
      _avisar();
    });
  }

  /// Envía todo lo pendiente. Devuelve cuántas operaciones salieron.
  Future<int> sincronizarTodo() async {
    if (_sincronizando) return 0;
    if (!await _conectividad.verificar()) return 0;

    _sincronizando = true;
    _avisar();

    var total = 0;
    try {
      // Primero los check-ins (mueven la racha) y luego lo demás.
      total += await _racha.sincronizar();
      total += await _rutinas.sincronizar();
      total += await _chat.sincronizar();
    } catch (_) {
      // Un fallo puntual no debe tumbar la app: queda para el próximo intento.
    } finally {
      _sincronizando = false;
      _ultimaSincronizacion = total;
      _avisar();
    }

    return total;
  }

  /// Suma de todo lo que espera en la cola.
  Future<int> pendientesTotales() async {
    return _racha.pendientes +
        _rutinas.pendientes +
        _chat.mensajes.where((m) => m.estado.name == 'pendiente').length;
  }

  void _avisar() {
    if (_descartado) return;
    notifyListeners();
  }

  @override
  void dispose() {
    _descartado = true;
    _suscripcion?.cancel();
    _suscripcion = null;
    super.dispose();
  }
}
