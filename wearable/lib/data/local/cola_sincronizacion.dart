import 'almacen_local.dart';

/// Cola de sincronización del reloj.
///
/// Todo lo que necesita el servidor pero no se pudo mandar (porque no había
/// red) se guarda aquí y se reintenta al recuperar la conexión. Es la pieza
/// que permite que, sin Internet, "la racha y las notificaciones sigan
/// funcionando con datos locales" mientras el chat encola.
///
/// Envuelve a [AlmacenLocal] y añade los métodos con tipo, para que cada
/// gestor de estado sepa qué pendientes le toca drenar.
class ColaSincronizacion {
  ColaSincronizacion(this._almacen);

  final AlmacenLocal _almacen;

  /// Un mensaje que no se pudo entregar al AI Assistant.
  Future<void> encolarMensaje({
    required int idLocal,
    required String texto,
    int? conversacionId,
  }) {
    return _almacen.encolar(TipoCola.mensajeChat, <String, dynamic>{
      'id_local': idLocal,
      'texto': texto,
      if (conversacionId != null) 'conversacion_id': conversacionId,
    });
  }

  Future<void> encolarCheckIn(String estado) {
    return _almacen.encolar(TipoCola.checkInAnimo, <String, dynamic>{
      'estado': estado,
      'fecha': DateTime.now().toIso8601String(),
    });
  }

  Future<void> encolarSesion({
    required String tipo,
    required int duracionSeg,
  }) {
    return _almacen.encolar(TipoCola.sesionRelajacion, <String, dynamic>{
      'tipo': tipo,
      'duracion_seg': duracionSeg,
      'completada': true,
    });
  }

  Future<List<ItemCola>> mensajesPendientes() =>
      _almacen.pendientesPorTipo(TipoCola.mensajeChat);

  Future<List<ItemCola>> checkInsPendientes() =>
      _almacen.pendientesPorTipo(TipoCola.checkInAnimo);

  Future<List<ItemCola>> sesionesPendientes() =>
      _almacen.pendientesPorTipo(TipoCola.sesionRelajacion);

  /// Se llama cuando el envío ya funcionó (o cuando no tiene sentido
  /// reintentarlo, por ejemplo un 400 del servidor).
  Future<void> descartar(int id) => _almacen.borrarDeCola(id);

  Future<int> pendientes() => _almacen.totalEnCola();

  Future<void> vaciar() => _almacen.limpiarCola();
}
