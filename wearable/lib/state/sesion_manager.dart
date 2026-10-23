import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../data/api/api_cliente.dart';
import '../data/api/auth_api.dart';
import '../data/api/modelos.dart';
import '../services/almacenamiento_seguro.dart';

/// Estado de la sesión en el reloj.
enum EstadoSesion { desconocida, autenticando, autenticada, sinSesion }

/// Gestor de la sesión.
///
/// Guarda el token en el almacén seguro (Keystore en Android), nunca en
/// preferencias simples. Expone [proveedorToken] para que el [ApiCliente] pida
/// el token sin que la capa de datos conozca a este gestor.
class SesionManager extends ChangeNotifier {
  SesionManager({
    required AuthApi authApi,
    required AlmacenamientoSeguro almacenSeguro,
  }) : _authApi = authApi,
       _almacen = almacenSeguro;

  final AuthApi _authApi;
  final AlmacenamientoSeguro _almacen;

  static const String claveToken = 'jorima_token';
  static const String claveUsuario = 'jorima_usuario';

  EstadoSesion _estado = EstadoSesion.desconocida;
  String? _token;
  UsuarioJorima? _usuario;
  String? _error;
  bool _ocupado = false;
  bool _descartado = false;

  EstadoSesion get estado => _estado;
  String? get token => _token;
  UsuarioJorima? get usuario => _usuario;
  String? get error => _error;
  bool get ocupado => _ocupado;
  bool get autenticado => _estado == EstadoSesion.autenticada;

  /// Firma compatible con `ProveedorToken` del [ApiCliente].
  Future<String?> proveedorToken() async => _token;

  /// Recupera la sesión guardada al abrir la app.
  ///
  /// Offline-first: si hay token, se entra directo con el perfil cacheado y no
  /// se obliga a nadie a escribir la contraseña en un reloj.
  Future<void> restaurar() async {
    _token = await _almacen.leer(claveToken);

    final usuarioGuardado = await _almacen.leer(claveUsuario);
    if (usuarioGuardado != null && usuarioGuardado.isNotEmpty) {
      try {
        final json = jsonDecode(usuarioGuardado);
        if (json is Map) {
          _usuario = UsuarioJorima.desdeJson(Map<String, dynamic>.from(json));
        }
      } catch (_) {
        _usuario = null;
      }
    }

    _estado = (_token != null && _token!.isNotEmpty)
        ? EstadoSesion.autenticada
        : EstadoSesion.sinSesion;
    _avisar();
  }

  Future<bool> iniciarSesion({
    required String correo,
    required String contrasena,
  }) async {
    _ocupado = true;
    _error = null;
    _estado = EstadoSesion.autenticando;
    _avisar();

    try {
      final sesion = await _authApi.iniciarSesion(
        correo: correo,
        contrasena: contrasena,
      );

      _token = sesion.token;
      _usuario = sesion.usuario;
      _estado = EstadoSesion.autenticada;

      await _almacen.guardar(claveToken, sesion.token);
      await _almacen.guardar(claveUsuario, jsonEncode(sesion.usuario.aJson()));

      return true;
    } on ApiExcepcion catch (e) {
      _error = e.mensaje;
      _estado = EstadoSesion.sinSesion;
      return false;
    } finally {
      _ocupado = false;
      _avisar();
    }
  }

  /// Marca la sesión como caída cuando el backend responde 401.
  ///
  /// No borra el token para no perderlo si fue un fallo puntual; sólo fuerza a
  /// volver a la pantalla de acceso.
  void sesionCaducada() {
    _estado = EstadoSesion.sinSesion;
    _token = null;
    _error = 'Tu sesión caducó. Vuelve a entrar.';
    _avisar();
  }

  Future<void> cerrarSesion() async {
    _token = null;
    _usuario = null;
    _estado = EstadoSesion.sinSesion;
    _error = null;

    await _almacen.borrar(claveToken);
    await _almacen.borrar(claveUsuario);
    _avisar();
  }

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
