import '../api/api_cliente.dart';
import '../api/modelos.dart';

/// Cliente de las rutinas de cuidado (RF-03).
///
/// ```text
/// GET  /api/relajacion/catalogo -> { catalogo: [ { id, tipo, titulo, ... } ] }
/// POST /api/relajacion/sesiones { tipo, duracion_seg, completada }
/// GET  /api/relajacion/conteo   -> { total }
/// GET  /api/capsula/hoy         -> { capsula: { id, titulo, texto, ... } }
/// ```
class RutinasApi {
  RutinasApi(this._cliente);

  final ApiCliente _cliente;

  Future<List<ActividadRelajacion>> catalogo() async {
    final json = await _cliente.obtener('/api/relajacion/catalogo');
    final lista = json['catalogo'];
    if (lista is! List) return <ActividadRelajacion>[];

    return lista
        .whereType<Map>()
        .map((m) => ActividadRelajacion.desdeJson(Map<String, dynamic>.from(m)))
        .toList();
  }

  /// Marca una sesión como completada.
  ///
  /// `tipo` debe ser uno de [TipoRutina.validosEnApi]; el backend responde 400
  /// con cualquier otro valor, por eso `agua` nunca llega hasta aquí.
  Future<void> registrarSesion({
    required String tipo,
    required int duracionSeg,
    bool completada = true,
  }) async {
    if (!TipoRutina.validosEnApi.contains(tipo)) {
      throw ApiExcepcion(
        'El tipo "$tipo" no existe en la API de rutinas',
      );
    }

    await _cliente.enviar('/api/relajacion/sesiones', <String, dynamic>{
      'tipo': tipo,
      'duracion_seg': duracionSeg,
      'completada': completada,
    });
  }

  /// Pausas activas completadas en total (nunca se reinicia).
  Future<int> conteo() async {
    final json = await _cliente.obtener('/api/relajacion/conteo');
    final total = json['total'];
    return total is num ? total.toInt() : 0;
  }

  Future<Capsula?> capsulaDeHoy() async {
    final json = await _cliente.obtener('/api/capsula/hoy');
    final capsula = json['capsula'];
    if (capsula is! Map) return null;
    return Capsula.desdeJson(Map<String, dynamic>.from(capsula));
  }
}
