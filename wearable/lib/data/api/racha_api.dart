import '../api/api_cliente.dart';
import '../api/modelos.dart';

/// Cliente de la racha de cuidado (RF-02).
///
/// La racha **no** tiene endpoint propio: se lee y se mueve a través del
/// check-in de ánimo, tal como está implementado en el backend
/// (`web/lib/racha.ts` solo se escribe desde `app/api/animo/route.ts`):
///
/// ```text
/// GET  /api/animo/hoy -> { ya_contesto, estado, racha{...} }
/// POST /api/animo     { estado } -> { registro, nivel_estres, racha{...} }
/// ```
///
/// Consecuencia de diseño: subir la racha exige un check-in de ánimo, no
/// completar una rutina. El documento de contexto dejaba ese punto abierto
/// ("se supone que sube al completar al menos una rutina al día"); el código
/// del backend resuelve la duda y la app se implementa como está el servidor.
class RachaApi {
  RachaApi(this._cliente);

  final ApiCliente _cliente;

  Future<EstadoAnimoHoy> estadoDeHoy() async {
    final json = await _cliente.obtener('/api/animo/hoy');
    return EstadoAnimoHoy.desdeJson(json);
  }

  /// Registra el ánimo de hoy y devuelve la racha ya actualizada.
  Future<RachaSnapshot> registrarCheckIn(String estado) async {
    if (!RachaSnapshot.estadosValidos.contains(estado)) {
      throw ApiExcepcion(
        'Estado inválido: usa uno de ${RachaSnapshot.estadosValidos.join(", ")}',
      );
    }

    final json = await _cliente.enviar('/api/animo', <String, dynamic>{
      'estado': estado,
    });

    return RachaSnapshot.desdeJson(json['racha']);
  }

  /// Un registro por día: `{ fecha, estado }`.
  Future<List<Map<String, dynamic>>> historial() async {
    final json = await _cliente.obtener('/api/animo/historial');
    final lista = json['registros'];
    if (lista is! List) return <Map<String, dynamic>>[];
    return lista
        .whereType<Map>()
        .map((m) => Map<String, dynamic>.from(m))
        .toList();
  }
}
