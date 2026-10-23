import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Almacenamiento seguro del token de sesión.
///
/// Regla de la Práctica 2 que se respeta aquí: el token **no** se guarda en
/// preferencias simples, sino en el almacén seguro del sistema. En Android
/// `flutter_secure_storage` usa `EncryptedSharedPreferences` respaldado por el
/// Keystore, así que el token queda cifrado por el sistema operativo.
abstract class AlmacenamientoSeguro {
  Future<String?> leer(String clave);
  Future<void> guardar(String clave, String valor);
  Future<void> borrar(String clave);
}

/// Implementación real, con el Keystore de Android.
///
/// En flutter_secure_storage 11 el cifrado con `EncryptedSharedPreferences` es
/// el comportamiento por defecto (la opción `encryptedSharedPreferences` ya no
/// existe como parámetro), así que basta con las opciones por defecto.
class AlmacenamientoSeguroAndroid implements AlmacenamientoSeguro {
  AlmacenamientoSeguroAndroid([FlutterSecureStorage? almacen])
    : _almacen = almacen ?? const FlutterSecureStorage(
        aOptions: AndroidOptions(),
      );

  final FlutterSecureStorage _almacen;

  @override
  Future<String?> leer(String clave) => _almacen.read(key: clave);

  @override
  Future<void> guardar(String clave, String valor) =>
      _almacen.write(key: clave, value: valor);

  @override
  Future<void> borrar(String clave) => _almacen.delete(key: clave);
}

/// Implementación en memoria, sólo para pruebas.
///
/// Permite probar el cifrado y los gestores de estado sin un dispositivo y sin
/// el canal de plataforma del plugin.
class AlmacenamientoSeguroMemoria implements AlmacenamientoSeguro {
  final Map<String, String> _datos = <String, String>{};

  @override
  Future<String?> leer(String clave) async => _datos[clave];

  @override
  Future<void> guardar(String clave, String valor) async {
    _datos[clave] = valor;
  }

  @override
  Future<void> borrar(String clave) async {
    _datos.remove(clave);
  }
}
