import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import 'config_api.dart';

/// Error de la capa de datos.
///
/// Distingue tres situaciones que el reloj trata distinto:
///  * sin red (`esRed`) -> modo sin conexión, se encola;
///  * 401 -> la sesión caducó, hay que volver a entrar;
///  * resto -> error del servidor, se avisa y no se pierde nada.
class ApiExcepcion implements Exception {
  const ApiExcepcion(this.mensaje, {this.codigo, this.esRed = false});

  final String mensaje;
  final int? codigo;
  final bool esRed;

  bool get esNoAutorizado => codigo == 401;

  @override
  String toString() => 'ApiExcepcion($codigo): $mensaje';
}

/// Firma para pedir el token de sesión sin acoplar la capa de datos al
/// gestor de estado.
typedef ProveedorToken = Future<String?> Function();

/// Cliente HTTP base del wearable.
///
/// Toda llamada a la red pasa por aquí: las pantallas nunca hablan con
/// `http` directamente (arquitectura en capas de la Práctica 2). Aquí se
/// centralizan el token `Bearer`, el `Content-Type`, el *timeout* y la
/// traducción de errores.
class ApiCliente {
  ApiCliente({
    required this.proveedorToken,
    http.Client? cliente,
    this.baseUrl = ConfigApi.baseUrl,
    this.timeout = ConfigApi.timeout,
  }) : _cliente = cliente ?? http.Client();

  final ProveedorToken proveedorToken;
  final String baseUrl;
  final Duration timeout;
  final http.Client _cliente;

  /// Cabeceras comunes. El middleware del backend exige
  /// `Authorization: Bearer <token>` para cualquier `/api/*` que no sea
  /// público (`web/middleware.ts`).
  Future<Map<String, String>> _cabeceras() async {
    final token = await proveedorToken();
    return <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  Uri _uri(String ruta, [Map<String, String>? query]) {
    final base = Uri.parse('$baseUrl$ruta');
    if (query == null || query.isEmpty) return base;
    return base.replace(queryParameters: <String, String>{
      ...base.queryParameters,
      ...query,
    });
  }

  Future<Map<String, dynamic>> obtener(
    String ruta, {
    Map<String, String>? query,
  }) => _ejecutar(() async {
    final respuesta = await _cliente
        .get(_uri(ruta, query), headers: await _cabeceras())
        .timeout(timeout);
    return _procesar(respuesta);
  });

  Future<Map<String, dynamic>> enviar(
    String ruta,
    Map<String, dynamic> cuerpo,
  ) => _ejecutar(() async {
    final respuesta = await _cliente
        .post(
          _uri(ruta),
          headers: await _cabeceras(),
          body: jsonEncode(cuerpo),
        )
        .timeout(timeout);
    return _procesar(respuesta);
  });

  /// Envuelve la llamada para convertir cualquier fallo en [ApiExcepcion].
  Future<Map<String, dynamic>> _ejecutar(
    Future<Map<String, dynamic>> Function() llamada,
  ) async {
    try {
      return await llamada();
    } on ApiExcepcion {
      rethrow;
    } on TimeoutException {
      throw const ApiExcepcion(
        'El servidor tardó demasiado en responder',
        esRed: true,
      );
    } on SocketException catch (e) {
      throw ApiExcepcion('Sin conexión: ${e.message}', esRed: true);
    } on http.ClientException catch (e) {
      throw ApiExcepcion('Sin conexión: ${e.message}', esRed: true);
    } on FormatException {
      throw const ApiExcepcion('La respuesta del servidor no es válida');
    }
  }

  Map<String, dynamic> _procesar(http.Response respuesta) {
    final cuerpo = respuesta.body.trim();

    Map<String, dynamic>? json;
    if (cuerpo.isNotEmpty) {
      final decodificado = jsonDecode(cuerpo);
      if (decodificado is Map<String, dynamic>) {
        json = decodificado;
      } else if (decodificado is Map) {
        json = Map<String, dynamic>.from(decodificado);
      }
    }

    if (respuesta.statusCode >= 200 && respuesta.statusCode < 300) {
      return json ?? <String, dynamic>{};
    }

    // El backend siempre responde `{ "error": "..." }` en los fallos.
    final mensaje = (json?['error']?.toString()) ?? 'Error ${respuesta.statusCode}';
    throw ApiExcepcion(mensaje, codigo: respuesta.statusCode);
  }

  void cerrar() => _cliente.close();
}
