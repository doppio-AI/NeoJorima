import 'dart:convert';

import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

import '../api/modelos.dart';
import 'almacen_local.dart';

/// Base de datos local del reloj (SQLite).
///
/// Esto es lo que hace posible el enfoque *offline-first* de la Práctica 2:
/// la racha, el catálogo de rutinas y los últimos mensajes se leen primero de
/// aquí, así la app abre con datos aunque no haya red, y la cola guarda lo que
/// no se pudo enviar.
///
/// Guarda el texto **tal como llega**; el cifrado lo pone el decorador
/// `AlmacenCifrado` por encima (ver `almacen_local.dart`), de forma que en el
/// archivo `.db` nunca hay texto plano de una conversación.
class AlmacenSqflite implements AlmacenLocal {
  AlmacenSqflite({String? ruta}) : _ruta = ruta;

  final String? _ruta;
  Database? _base;

  static const String _archivo = 'jorima_wearable.db';
  static const int _version = 1;

  Future<Database> get _db async {
    final existente = _base;
    if (existente != null) return existente;

    final ruta = _ruta ?? p.join(await getDatabasesPath(), _archivo);
    final base = await openDatabase(
      ruta,
      version: _version,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE cache (
            clave TEXT PRIMARY KEY,
            valor TEXT NOT NULL,
            actualizado INTEGER NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE mensajes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL,
            texto TEXT NOT NULL,
            fecha INTEGER NOT NULL,
            estado TEXT NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE cola (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            payload TEXT NOT NULL,
            creado INTEGER NOT NULL
          )
        ''');
        await db.execute('CREATE INDEX ix_cola_tipo ON cola (tipo)');
      },
    );

    _base = base;
    return base;
  }

  @override
  Future<Map<String, dynamic>?> leerCache(String clave) async {
    final filas = await (await _db).query(
      'cache',
      columns: <String>['valor'],
      where: 'clave = ?',
      whereArgs: <Object?>[clave],
      limit: 1,
    );

    if (filas.isEmpty) return null;

    final valor = filas.first['valor'] as String?;
    if (valor == null) return null;

    final decodificado = jsonDecode(valor);
    return decodificado is Map
        ? Map<String, dynamic>.from(decodificado)
        : null;
  }

  @override
  Future<void> guardarCache(String clave, Map<String, dynamic> valor) async {
    await (await _db).insert('cache', <String, Object?>{
      'clave': clave,
      'valor': jsonEncode(valor),
      'actualizado': DateTime.now().millisecondsSinceEpoch,
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  @override
  Future<List<MensajeChat>> mensajes() async {
    final filas = await (await _db).query('mensajes', orderBy: 'id ASC');
    return filas.map(_mensajeDesdeFila).toList();
  }

  MensajeChat _mensajeDesdeFila(Map<String, Object?> fila) {
    return MensajeChat(
      id: (fila['id'] as num?)?.toInt() ?? 0,
      role: fila['role'] as String? ?? 'assistant',
      texto: fila['texto'] as String? ?? '',
      fecha: DateTime.fromMillisecondsSinceEpoch(
        (fila['fecha'] as num?)?.toInt() ?? 0,
      ),
      estado: EstadoMensaje.values.firstWhere(
        (e) => e.name == fila['estado'],
        orElse: () => EstadoMensaje.enviado,
      ),
    );
  }

  @override
  Future<int> agregarMensaje(MensajeChat mensaje) async {
    return (await _db).insert('mensajes', <String, Object?>{
      'role': mensaje.role,
      'texto': mensaje.texto,
      'fecha': mensaje.fecha.millisecondsSinceEpoch,
      'estado': mensaje.estado.name,
    });
  }

  @override
  Future<void> actualizarEstadoMensaje(
    int idLocal,
    EstadoMensaje estado,
  ) async {
    await (await _db).update(
      'mensajes',
      <String, Object?>{'estado': estado.name},
      where: 'id = ?',
      whereArgs: <Object?>[idLocal],
    );
  }

  @override
  Future<void> recortarMensajes(int conservar) async {
    // "Se guardan pocas": se conservan sólo los últimos N mensajes.
    await (await _db).rawDelete('''
      DELETE FROM mensajes
      WHERE id NOT IN (SELECT id FROM mensajes ORDER BY id DESC LIMIT ?)
    ''', <Object?>[conservar]);
  }

  @override
  Future<void> limpiarMensajes() async {
    await (await _db).delete('mensajes');
  }

  @override
  Future<int> encolar(String tipo, Map<String, dynamic> payload) async {
    return (await _db).insert('cola', <String, Object?>{
      'tipo': tipo,
      'payload': jsonEncode(payload),
      'creado': DateTime.now().millisecondsSinceEpoch,
    });
  }

  @override
  Future<List<ItemCola>> pendientesPorTipo(String tipo) async {
    final filas = await (await _db).query(
      'cola',
      where: 'tipo = ?',
      whereArgs: <Object?>[tipo],
      orderBy: 'id ASC',
    );

    return filas.map((fila) {
      final payload = jsonDecode(fila['payload'] as String? ?? '{}');
      return ItemCola(
        id: (fila['id'] as num?)?.toInt() ?? 0,
        tipo: fila['tipo'] as String? ?? tipo,
        payload: payload is Map ? Map<String, dynamic>.from(payload) : <String, dynamic>{},
        creado: DateTime.fromMillisecondsSinceEpoch(
          (fila['creado'] as num?)?.toInt() ?? 0,
        ),
      );
    }).toList();
  }

  @override
  Future<int> totalEnCola() async {
    final resultado = await (await _db).rawQuery('SELECT COUNT(*) AS n FROM cola');
    return (resultado.first['n'] as num?)?.toInt() ?? 0;
  }

  @override
  Future<void> borrarDeCola(int id) async {
    await (await _db).delete('cola', where: 'id = ?', whereArgs: <Object?>[id]);
  }

  @override
  Future<void> limpiarCola() async {
    await (await _db).delete('cola');
  }

  @override
  Future<void> cerrar() async {
    await _base?.close();
    _base = null;
  }
}
