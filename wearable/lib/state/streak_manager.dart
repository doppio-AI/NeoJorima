import 'package:flutter/foundation.dart';

import '../data/api/api_cliente.dart';
import '../data/api/modelos.dart';
import '../data/api/racha_api.dart';
import '../data/local/almacen_local.dart';
import '../data/local/cola_sincronizacion.dart';

/// Gestor de la racha de cuidado (RF-02).
///
/// Flujo offline-first:
///  1. al abrir, se pinta la racha guardada en el reloj (sin esperar a la red);
///  2. se pide `GET /api/animo/hoy` y se actualiza;
///  3. si no hay red, el check-in se guarda en la cola y se refleja de forma
///     optimista, para que el gesto no "se pierda" delante del usuario.
class StreakManager extends ChangeNotifier {
  StreakManager({
    required RachaApi api,
    required AlmacenLocal almacen,
    required ColaSincronizacion cola,
  }) : _api = api,
       _almacen = almacen,
       _cola = cola;

  final RachaApi _api;
  final AlmacenLocal _almacen;
  final ColaSincronizacion _cola;

  static const String claveCache = 'racha_hoy';

  RachaSnapshot _racha = RachaSnapshot.vacia;
  bool _yaContesto = false;
  String? _estado;
  bool _cargando = false;
  bool _sinConexion = false;
  String? _error;
  int _pendientes = 0;
  bool _descartado = false;

  RachaSnapshot get racha => _racha;
  bool get yaContesto => _yaContesto;
  String? get estado => _estado;
  bool get cargando => _cargando;
  bool get sinConexion => _sinConexion;
  String? get error => _error;

  /// Check-ins que esperan en la cola.
  int get pendientes => _pendientes;

  Future<void> cargar() async {
    _cargando = true;
    _error = null;
    _avisar();

    // 1) Lo que ya sabemos, sin red.
    final guardado = await _almacen.leerCache(claveCache);
    if (guardado != null) {
      _aplicar(EstadoAnimoHoy.desdeJson(guardado));
    }

    // 2) Lo que dice el servidor.
    try {
      final hoy = await _api.estadoDeHoy();
      _aplicar(hoy);
      _sinConexion = false;
      _error = null;
      await _almacen.guardarCache(claveCache, _aJson(hoy));
    } on ApiExcepcion catch (e) {
      _sinConexion = e.esRed;
      // Sin red no es un error para la persona: se sigue con lo local.
      _error = e.esRed ? null : e.mensaje;
    } finally {
      _cargando = false;
      _pendientes = (await _cola.checkInsPendientes()).length;
      _avisar();
    }
  }

  /// Registra el ánimo de hoy, que es lo que mueve la racha en el backend.
  ///
  /// Devuelve `true` si el check-in quedó registrado (en el servidor o en la
  /// cola para enviarse después).
  Future<bool> registrarCheckIn(String estado) async {
    if (!RachaSnapshot.estadosValidos.contains(estado)) {
      _error = 'Estado de ánimo no válido';
      _avisar();
      return false;
    }

    _error = null;

    try {
      final racha = await _api.registrarCheckIn(estado);
      _racha = racha;
      _yaContesto = true;
      _estado = estado;
      _sinConexion = false;
      await _almacen.guardarCache(claveCache, _aJson(_instantanea()));
      _avisar();
      return true;
    } on ApiExcepcion catch (e) {
      if (e.esRed) {
        // Sin red: se guarda para después y se refleja en el momento.
        await _cola.encolarCheckIn(estado);
        _racha = _incrementoLocal(_racha);
        _yaContesto = true;
        _estado = estado;
        _sinConexion = true;
        _pendientes = (await _cola.checkInsPendientes()).length;
        await _almacen.guardarCache(claveCache, _aJson(_instantanea()));
        _avisar();
        return true;
      }

      _error = e.mensaje;
      _avisar();
      return false;
    }
  }

  /// Reenvía los check-ins hechos sin conexión. Devuelve cuántos se enviaron.
  Future<int> sincronizar() async {
    final pendientes = await _cola.checkInsPendientes();
    if (pendientes.isEmpty) return 0;

    var enviados = 0;
    for (final item in pendientes) {
      try {
        final estado = item.payload['estado']?.toString();
        if (estado == null || !RachaSnapshot.estadosValidos.contains(estado)) {
          // Dato inservible: se descarta para no atascar la cola.
          await _cola.descartar(item.id);
          continue;
        }

        final racha = await _api.registrarCheckIn(estado);
        _racha = racha;
        await _cola.descartar(item.id);
        enviados++;
      } on ApiExcepcion catch (e) {
        if (e.esRed) break; // sigue sin haber red: se reintenta luego
        await _cola.descartar(item.id); // el servidor lo rechazó: no insistir
      }
    }

    if (enviados > 0) {
      _yaContesto = true;
      _sinConexion = false;
      await _almacen.guardarCache(claveCache, _aJson(_instantanea()));
    }

    _pendientes = (await _cola.checkInsPendientes()).length;
    _avisar();
    return enviados;
  }

  /// Misma regla que `actualizarRacha` en `web/lib/racha.ts`, aplicada en local
  /// mientras el servidor no la confirma.
  RachaSnapshot _incrementoLocal(RachaSnapshot racha) {
    if (_yaContesto) return racha; // idempotente: ya se contó hoy
    final actual = racha.rachaActual + 1;
    return RachaSnapshot(
      rachaActual: actual,
      rachaRaiz: racha.rachaRaiz,
      mejorRacha: actual > racha.mejorRacha ? actual : racha.mejorRacha,
      diasTotales: racha.diasTotales + 1,
    );
  }

  EstadoAnimoHoy _instantanea() => EstadoAnimoHoy(
    yaContesto: _yaContesto,
    estado: _estado,
    racha: _racha,
  );

  void _aplicar(EstadoAnimoHoy hoy) {
    _racha = hoy.racha;
    _yaContesto = hoy.yaContesto;
    _estado = hoy.estado;
  }

  Map<String, dynamic> _aJson(EstadoAnimoHoy hoy) => <String, dynamic>{
    'ya_contesto': hoy.yaContesto,
    'estado': hoy.estado,
    'racha': hoy.racha.aJson(),
  };

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
