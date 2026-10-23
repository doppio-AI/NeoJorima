import 'dart:convert';

import 'package:encrypt/encrypt.dart' as enc;

import 'almacenamiento_seguro.dart';

/// Cifrado de los mensajes que se guardan en el reloj.
///
/// La Práctica 2 pide que las conversaciones del chat, por ser información
/// emocional sensible, se guarden "pocas y cifradas". Aquí se cumple la parte
/// de cifrado:
///
///  * clave AES-256 generada en el dispositivo (`Key.fromSecureRandom`) y
///    guardada en el almacén seguro respaldado por el Keystore;
///  * **una IV nueva por mensaje**, así dos mensajes iguales no producen el
///    mismo texto cifrado;
///  * modo GCM, que además de cifrar autentica el contenido (detecta
///    manipulación del archivo de base de datos).
///
/// La clave nunca se escribe en la base de datos: si alguien copia el archivo
/// `.db` del reloj no puede leer las conversaciones.
class CifradoLocal {
  CifradoLocal(this._almacen);

  final AlmacenamientoSeguro _almacen;

  static const String _claveCifrado = 'jorima_clave_cifrado';
  static const String _separador = ':';
  static const int _largoIv = 12;

  enc.Encrypter? _cifrador;

  Future<enc.Encrypter> _obtenerCifrador() async {
    final existente = _cifrador;
    if (existente != null) return existente;

    var clave = await _almacen.leer(_claveCifrado);

    if (clave == null || clave.isEmpty) {
      final nueva = enc.Key.fromSecureRandom(32);
      clave = base64Encode(nueva.bytes);
      await _almacen.guardar(_claveCifrado, clave);
    }

    final cifrador = enc.Encrypter(
      enc.AES(enc.Key(base64Decode(clave)), mode: enc.AESMode.gcm),
    );
    _cifrador = cifrador;
    return cifrador;
  }

  /// Devuelve `base64(iv):base64(cifrado)`, listo para guardar como TEXT.
  Future<String> cifrar(String texto) async {
    final cifrador = await _obtenerCifrador();
    final iv = enc.IV.fromSecureRandom(_largoIv);
    final cifrado = cifrador.encrypt(texto, iv: iv);
    return '${base64Encode(iv.bytes)}$_separador${cifrado.base64}';
  }

  /// Invierte [cifrar]. Si el dato está corrupto devuelve un texto vacío en
  /// lugar de tumbar la pantalla del reloj.
  Future<String> descifrar(String almacenado) async {
    try {
      final partes = almacenado.split(_separador);
      if (partes.length != 2) return '';

      final cifrador = await _obtenerCifrador();
      return cifrador.decrypt64(partes[1], iv: enc.IV(base64Decode(partes[0])));
    } catch (_) {
      return '';
    }
  }
}
