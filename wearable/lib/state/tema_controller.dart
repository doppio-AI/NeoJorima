import 'package:flutter/material.dart';

import '../../data/local/almacen_local.dart';

/// Controla el tema claro/oscuro de la app.
///
/// El proyecto web alterna con `data-theme="dark"`; aquí se guarda la
/// preferencia en la base local para que el reloj recuerde la elección (en
/// pantalla OLED el tema oscuro además ahorra batería).
class TemaController extends ChangeNotifier {
  TemaController({required AlmacenLocal almacen}) : _almacen = almacen;

  final AlmacenLocal _almacen;

  static const String claveCache = 'tema';

  ThemeMode _modo = ThemeMode.system;

  ThemeMode get modo => _modo;

  bool get esOscuro => _modo == ThemeMode.dark;

  Future<void> cargar() async {
    final cache = await _almacen.leerCache(claveCache);
    final valor = cache?['modo']?.toString();

    switch (valor) {
      case 'claro':
        _modo = ThemeMode.light;
      case 'oscuro':
        _modo = ThemeMode.dark;
      default:
        _modo = ThemeMode.system;
    }

    notifyListeners();
  }

  Future<void> fijar(bool oscuro) async {
    _modo = oscuro ? ThemeMode.dark : ThemeMode.light;
    await _almacen.guardarCache(claveCache, <String, dynamic>{
      'modo': oscuro ? 'oscuro' : 'claro',
    });
    notifyListeners();
  }

  Future<void> seguirAlSistema() async {
    _modo = ThemeMode.system;
    await _almacen.guardarCache(claveCache, <String, dynamic>{'modo': 'sistema'});
    notifyListeners();
  }
}
