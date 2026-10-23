import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';

/// Detección de red del reloj.
///
/// La Práctica 2 pide un "Connectivity Manager" en la capa de servicios: aquí
/// vive. Cuando pasa de "sin red" a "con red", los gestores de estado drenan la
/// cola de sincronización.
///
/// Ojo: `connectivity_plus` informa si hay una interfaz de red activa, no si
/// Internet funciona de verdad. Para eso está el `catch` de red del
/// `ApiCliente`, que marca la petición como fallida y la encola igual.
class ServicioConectividad {
  ServicioConectividad({Connectivity? conectividad})
    : _conectividad = conectividad ?? Connectivity();

  final Connectivity _conectividad;
  final StreamController<bool> _cambios = StreamController<bool>.broadcast();

  bool _enLinea = true;
  StreamSubscription<List<ConnectivityResult>>? _suscripcion;

  bool get enLinea => _enLinea;

  /// Emite `true` cuando se recupera la conexión.
  Stream<bool> get cambios => _cambios.stream;

  Future<void> iniciar() async {
    _enLinea = await verificar();

    _suscripcion ??= _conectividad.onConnectivityChanged.listen(
      (resultados) {
        final antes = _enLinea;
        _enLinea = _hayRed(resultados);
        if (antes != _enLinea) _cambios.add(_enLinea);
      },
      onError: (_) {},
    );
  }

  Future<bool> verificar() async {
    try {
      return _hayRed(await _conectividad.checkConnectivity());
    } catch (_) {
      return false;
    }
  }

  /// connectivity_plus 7 devuelve una lista de tipos de transporte.
  bool _hayRed(List<ConnectivityResult> resultados) =>
      resultados.any((r) => r != ConnectivityResult.none);

  Future<void> liberar() async {
    await _suscripcion?.cancel();
    _suscripcion = null;
    await _cambios.close();
  }
}
