import '../api/api_cliente.dart';
import '../api/modelos.dart';

/// Cliente del AI Assistant (RF-01).
///
/// ```text
/// POST /api/chat  { mensaje, conversacion_id? }
///   -> { conversacion_id, respuesta, alerta?, nivel?, sentimiento? }
/// GET  /api/chat?conversacion_id=N
///   -> { conversacion_id, mensajes: [{ mensaje_id, role, texto, fecha }] }
/// ```
///
/// El backend limita el mensaje a 2000 caracteres y el historial a 16 turnos
/// (`MAX_MENSAJE_LENGTH`, `MAX_HISTORIAL_MENSAJES` en
/// `web/app/api/chat/route.ts`). El reloj recorta más por su cuenta para que
/// el mensaje siga siendo "breve" como pide RF-01.
class ChatApi {
  ChatApi(this._cliente);

  final ApiCliente _cliente;

  /// Límite propio del reloj: un mensaje largo no se puede leer en 200 px.
  static const int maxCaracteres = 280;

  Future<RespuestaChat> enviarMensaje(
    String mensaje, {
    int? conversacionId,
  }) async {
    final texto = mensaje.trim();
    if (texto.isEmpty) {
      throw const ApiExcepcion('El mensaje está vacío');
    }

    final json = await _cliente.enviar('/api/chat', <String, dynamic>{
      'mensaje': texto.length > maxCaracteres
          ? texto.substring(0, maxCaracteres)
          : texto,
      if (conversacionId != null) 'conversacion_id': conversacionId,
    });

    return RespuestaChat.desdeJson(json);
  }

  /// Mensajes de una conversación, del más viejo al más nuevo.
  Future<List<MensajeChat>> historial(int conversacionId) async {
    final json = await _cliente.obtener(
      '/api/chat',
      query: <String, String>{'conversacion_id': '$conversacionId'},
    );

    final lista = json['mensajes'];
    if (lista is! List) return <MensajeChat>[];

    return lista
        .whereType<Map>()
        .map((m) => MensajeChat.desdeJson(Map<String, dynamic>.from(m)))
        .toList();
  }
}
