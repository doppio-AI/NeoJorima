import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:jorima_wearable/data/api/api_cliente.dart';
import 'package:jorima_wearable/data/api/chat_api.dart';
import 'package:jorima_wearable/data/api/modelos.dart';
import 'package:jorima_wearable/data/api/racha_api.dart';
import 'package:jorima_wearable/data/api/rutinas_api.dart';
import 'package:jorima_wearable/data/local/almacen_local.dart';
import 'package:jorima_wearable/data/local/cola_sincronizacion.dart';
import 'package:jorima_wearable/services/notificaciones.dart';
import 'package:jorima_wearable/state/chat_manager.dart';
import 'package:jorima_wearable/state/routine_scheduler.dart';
import 'package:jorima_wearable/state/streak_manager.dart';

/// Pruebas de los gestores de estado contra un backend simulado.
///
/// Se usa `MockClient` del paquete `http`, así que el cliente HTTP, la
/// serialización, el manejo de errores y la cola de sincronización son los
/// reales; lo único simulado es la red.

ApiCliente _cliente(MockClient simulador) => ApiCliente(
  proveedorToken: () async => 'token-de-prueba',
  cliente: simulador,
  baseUrl: 'https://jorima.test',
);

/// Red simulada que siempre falla, como un reloj sin cobertura.
MockClient _sinRed() => MockClient((_) async {
  throw http.ClientException('Sin conexión de red');
});

MockClient _responder(Map<String, dynamic> cuerpo, {int codigo = 200}) {
  return MockClient(
    (_) async => http.Response(
      jsonEncode(cuerpo),
      codigo,
      headers: <String, String>{'content-type': 'application/json'},
    ),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late AlmacenLocal almacen;
  late ColaSincronizacion cola;

  setUp(() {
    almacen = AlmacenMemoria();
    cola = ColaSincronizacion(almacen);
  });

  group('RF-01 · ChatManager', () {
    test('guarda el mensaje y la respuesta real de POST /api/chat', () async {
      final api = ChatApi(
        _cliente(
          _responder(<String, dynamic>{
            'conversacion_id': 7,
            'respuesta': 'Respira conmigo: inhala en cuatro.',
            'alerta': false,
          }),
        ),
      );

      final chat = ChatManager(api: api, almacen: almacen, cola: cola);
      await chat.enviar('Tengo mucho estrés');

      expect(chat.mensajes, hasLength(2));
      expect(chat.mensajes.first.esUsuario, isTrue);
      expect(chat.mensajes.first.texto, 'Tengo mucho estrés');
      expect(chat.mensajes.last.role, 'assistant');
      expect(chat.mensajes.last.texto, contains('Respira conmigo'));
      expect(chat.conversacionId, 7);
      expect(chat.sinConexion, isFalse);
      expect(await cola.pendientes(), 0);
    });

    test('sin red deja el mensaje pendiente y lo encola', () async {
      final api = ChatApi(_cliente(_sinRed()));
      final chat = ChatManager(api: api, almacen: almacen, cola: cola);

      await chat.enviar('¿Estás ahí?');

      expect(chat.mensajes, hasLength(1));
      expect(chat.mensajes.single.estado, EstadoMensaje.pendiente);
      expect(chat.sinConexion, isTrue);
      expect(await cola.mensajesPendientes(), hasLength(1));
    });

    test('al volver la red reenvía lo pendiente y guarda la respuesta', () async {
      // 1) Se escribe sin red.
      final sinRed = ChatManager(
        api: ChatApi(_cliente(_sinRed())),
        almacen: almacen,
        cola: cola,
      );
      await sinRed.enviar('No puedo dormir');
      expect(await cola.mensajesPendientes(), hasLength(1));

      // 2) Vuelve la red: otro gestor sobre el mismo almacén (como al reabrir
      //    la app) drena la cola.
      final conRed = ChatManager(
        api: ChatApi(
          _cliente(
            _responder(<String, dynamic>{
              'conversacion_id': 11,
              'respuesta': 'Vamos a bajar el ritmo juntos.',
            }),
          ),
        ),
        almacen: almacen,
        cola: cola,
      );

      final enviados = await conRed.sincronizar();

      expect(enviados, 1);
      expect(await cola.mensajesPendientes(), isEmpty);
      expect(conRed.conversacionId, 11);
      expect(
        conRed.mensajes.any((m) => m.texto.contains('bajar el ritmo')),
        isTrue,
      );
    });
  });

  group('RF-02 · StreakManager', () {
    test('carga la racha real de GET /api/animo/hoy', () async {
      final api = RachaApi(
        _cliente(
          _responder(<String, dynamic>{
            'ya_contesto': true,
            'estado': 'bien',
            'racha': <String, dynamic>{
              'racha_actual': 12,
              'racha_raiz': 4,
              'mejor_racha': 15,
              'dias_totales': 40,
            },
          }),
        ),
      );

      final racha = StreakManager(api: api, almacen: almacen, cola: cola);
      await racha.cargar();

      expect(racha.racha.rachaActual, 12);
      expect(racha.yaContesto, isTrue);
      expect(racha.estado, 'bien');
      expect(racha.sinConexion, isFalse);

      // Y queda cacheada para el próximo arranque sin red.
      expect(await almacen.leerCache(StreakManager.claveCache), isNotNull);
    });

    test('sin red arranca con la racha cacheada', () async {
      await almacen.guardarCache(StreakManager.claveCache, <String, dynamic>{
        'ya_contesto': false,
        'estado': null,
        'racha': <String, dynamic>{
          'racha_actual': 5,
          'racha_raiz': 2,
          'mejor_racha': 9,
          'dias_totales': 20,
        },
      });

      final racha = StreakManager(
        api: RachaApi(_cliente(_sinRed())),
        almacen: almacen,
        cola: cola,
      );

      await racha.cargar();

      expect(racha.racha.rachaActual, 5);
      expect(racha.sinConexion, isTrue);
      // Sin conexión no es un error para la persona.
      expect(racha.error, isNull);
    });

    test('el check-in en línea mueve la racha con la respuesta del servidor', () async {
      final api = RachaApi(
        _cliente(
          _responder(<String, dynamic>{
            'registro': <String, dynamic>{'estado': 'bien'},
            'nivel_estres': 30,
            'racha': <String, dynamic>{
              'racha_actual': 6,
              'racha_raiz': 2,
              'mejor_racha': 9,
              'dias_totales': 21,
            },
          }),
        ),
      );

      final racha = StreakManager(api: api, almacen: almacen, cola: cola);
      final ok = await racha.registrarCheckIn('bien');

      expect(ok, isTrue);
      expect(racha.racha.rachaActual, 6);
      expect(racha.yaContesto, isTrue);
      expect(await cola.checkInsPendientes(), isEmpty);
    });

    test('el check-in sin red se refleja y se encola', () async {
      final racha = StreakManager(
        api: RachaApi(_cliente(_sinRed())),
        almacen: almacen,
        cola: cola,
      );

      // Estado de partida: 4 días.
      await almacen.guardarCache(StreakManager.claveCache, <String, dynamic>{
        'ya_contesto': false,
        'estado': null,
        'racha': <String, dynamic>{
          'racha_actual': 4,
          'racha_raiz': 0,
          'mejor_racha': 4,
          'dias_totales': 4,
        },
      });
      await racha.cargar();

      final ok = await racha.registrarCheckIn('regular');

      expect(ok, isTrue);
      // Optimista y coherente con la regla del backend: +1 día.
      expect(racha.racha.rachaActual, 5);
      expect(racha.sinConexion, isTrue);
      expect(await cola.checkInsPendientes(), hasLength(1));
    });

    test('al reconectar vacía la cola de check-ins', () async {
      await cola.encolarCheckIn('bien');

      final racha = StreakManager(
        api: RachaApi(
          _cliente(
            _responder(<String, dynamic>{
              'registro': <String, dynamic>{},
              'racha': <String, dynamic>{
                'racha_actual': 13,
                'racha_raiz': 4,
                'mejor_racha': 15,
                'dias_totales': 41,
              },
            }),
          ),
        ),
        almacen: almacen,
        cola: cola,
      );

      final enviados = await racha.sincronizar();

      expect(enviados, 1);
      expect(await cola.checkInsPendientes(), isEmpty);
      expect(racha.racha.rachaActual, 13);
    });
  });

  group('RF-03 · RoutineScheduler', () {
    test('el agua no se envía a la API porque no es un tipo válido', () async {
      var llamadas = 0;

      final api = RutinasApi(
        _cliente(
          MockClient((_) async {
            llamadas++;
            return http.Response('{}', 200);
          }),
        ),
      );

      final rutinas = RoutineScheduler(
        api: api,
        notificaciones: ServicioNotificaciones(),
        almacen: almacen,
        cola: cola,
      );

      await rutinas.registrarCompletada(ActividadRelajacion.agua);

      expect(llamadas, 0);
      expect(await cola.sesionesPendientes(), isEmpty);
      expect(rutinas.completadasHoy, 1);
    });

    test('una rutina sin red queda en la cola de sesiones', () async {
      final rutinas = RoutineScheduler(
        api: RutinasApi(_cliente(_sinRed())),
        notificaciones: ServicioNotificaciones(),
        almacen: almacen,
        cola: cola,
      );

      await rutinas.registrarCompletada(
        const ActividadRelajacion(
          id: 'respiracion-478',
          tipo: TipoRutina.respiracion,
          titulo: 'Respiración 4-7-8',
          descripcion: 'Inhala, sostén y exhala.',
          duracionSeg: 90,
          pantalla: 'RelajacionRespiracion',
        ),
      );

      expect(await cola.sesionesPendientes(), hasLength(1));

      final pendiente = (await cola.sesionesPendientes()).single;
      expect(pendiente.payload['tipo'], 'respiracion');
      expect(pendiente.payload['duracion_seg'], 90);
    });
  });
}
