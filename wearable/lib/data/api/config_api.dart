/// URL base del backend de Jorima.
///
/// El valor **no se inventó**: se toma del cliente móvil que ya existe en el
/// repositorio (`movil/config/api.ts`, constante `VERCEL_URL`). Es el mismo
/// backend que usa la app de teléfono, por lo que el reloj habla con el mismo
/// servicio de chat, racha y rutinas.
///
/// Para probar contra el servidor local, `movil/config/api.ts` usa
/// `http://<IP_LOCAL>:3000`; aquí se deja la constante para no tocar código
/// cuando se haga la demo en red local (ver `ConfigApi.conBaseLocal`).
class ConfigApi {
  ConfigApi._();

  /// Backend en producción.
  static const String baseUrl = 'https://jorima-eight.vercel.app';

  /// Tiempo máximo de espera por petición.
  static const Duration timeout = Duration(seconds: 20);

  /// Ruta del endpoint de autenticación del cliente móvil.
  ///
  /// El middleware del backend (`web/middleware.ts`) deja público
  /// `/api/login`, por eso `login/mobile` no requiere token.
  static const String rutaLogin = '/api/login/mobile';

  /// Igual que `LOCAL_IP` en `movil/config/api.ts`, para demos sin internet
  /// pero con el servidor del equipo en la misma red WiFi.
  static String conBaseLocal(String ip, {int puerto = 3000}) =>
      'http://$ip:$puerto';
}
