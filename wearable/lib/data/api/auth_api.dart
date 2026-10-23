import '../api/api_cliente.dart';
import '../api/config_api.dart';
import '../api/modelos.dart';

/// Autenticación contra el backend de Jorima.
///
/// Usa `POST /api/login/mobile`, el mismo endpoint que la app de teléfono
/// (`movil/app/(auth)/login.tsx`), porque devuelve el token `Bearer` que el
/// middleware del backend acepta para el resto de `/api/*`.
class AuthApi {
  AuthApi(this._cliente);

  final ApiCliente _cliente;

  Future<SesionAutenticada> iniciarSesion({
    required String correo,
    required String contrasena,
  }) async {
    final json = await _cliente.enviar(ConfigApi.rutaLogin, <String, dynamic>{
      'correo': correo.trim().toLowerCase(),
      'contrasena': contrasena,
    });

    final sesion = SesionAutenticada.desdeJson(json);

    if (sesion.token.isEmpty) {
      throw const ApiExcepcion(
        'El servidor no devolvió un token de sesión',
      );
    }

    return sesion;
  }
}
