import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:jorima_wearable/data/api/api_cliente.dart';
import 'package:jorima_wearable/data/api/auth_api.dart';
import 'package:jorima_wearable/data/api/chat_api.dart';
import 'package:jorima_wearable/data/api/modelos.dart';
import 'package:jorima_wearable/data/api/racha_api.dart';
import 'package:jorima_wearable/data/api/rutinas_api.dart';
import 'package:jorima_wearable/data/local/almacen_local.dart';
import 'package:jorima_wearable/data/local/cola_sincronizacion.dart';
import 'package:jorima_wearable/services/almacenamiento_seguro.dart';
import 'package:jorima_wearable/services/conectividad.dart';
import 'package:jorima_wearable/services/notificaciones.dart';
import 'package:jorima_wearable/state/chat_manager.dart';
import 'package:jorima_wearable/state/routine_scheduler.dart';
import 'package:jorima_wearable/state/sesion_manager.dart';
import 'package:jorima_wearable/state/sincronizador.dart';
import 'package:jorima_wearable/state/streak_manager.dart';
import 'package:jorima_wearable/state/tema_controller.dart';
import 'package:jorima_wearable/theme/tema.dart';
import 'package:jorima_wearable/ui/pantallas/pantalla_actividad.dart';
import 'package:jorima_wearable/ui/pantallas/pantalla_ajustes.dart';
import 'package:jorima_wearable/ui/pantallas/pantalla_chat.dart';
import 'package:jorima_wearable/ui/pantallas/pantalla_inicio.dart';
import 'package:jorima_wearable/ui/pantallas/pantalla_login.dart';
import 'package:jorima_wearable/ui/pantallas/pantalla_racha.dart';
import 'package:jorima_wearable/ui/pantallas/pantalla_rutinas.dart';
import 'package:provider/provider.dart';

/// Prueba de humo de la interfaz.
///
/// Monta cada pantalla en una ventana del tamaño de un reloj redondo
/// (220 × 220 px lógicos) y comprueba que se construye sin excepciones. Un
/// desbordamiento de `RenderFlex` en el reloj real sale aquí como fallo de la
/// prueba, no como sorpresa en la muñeca.
/// Falla si hubo un error de layout (por ejemplo, un desbordamiento).
void exigirSinErrores(WidgetTester tester) {
  final error = tester.takeException();
  if (error != null) {
    // ignore: avoid_print
    print('==== ERROR DE LAYOUT ====\n$error\n=========================');
  }
  expect(error, isNull);
}

/// Carga Nunito de verdad en el entorno de pruebas.
///
/// Sin esto, Flutter usa una tipografía de relleno cuyas letras son cuadradas y
/// mucho más anchas que Nunito, y el reloj parecería desbordarse cuando con la
/// fuente real todo cabe. Cargar la fuente real hace que la prueba de layout
/// mida lo mismo que el reloj.
Future<void> cargarTipografiaNunito() async {
  final cargador = FontLoader('Nunito');
  for (final peso in <String>['Regular', 'SemiBold', 'Bold', 'ExtraBold']) {
    cargador.addFont(rootBundle.load('assets/fonts/Nunito-$peso.ttf'));
  }
  await cargador.load();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late AlmacenLocal almacen;
  late ColaSincronizacion cola;
  late SesionManager sesion;
  late ChatManager chat;
  late StreakManager racha;
  late RoutineScheduler rutinas;
  late Sincronizador sincronizador;
  late TemaController tema;

  /// Backend simulado con datos realistas de la API.
  MockClient backend() => MockClient((peticion) async {
    final ruta = peticion.url.path;

    if (ruta == '/api/animo/hoy') {
      return http.Response(
        jsonEncode(<String, dynamic>{
          'ya_contesto': true,
          'estado': 'bien',
          'racha': <String, dynamic>{
            'racha_actual': 12,
            'racha_raiz': 4,
            'mejor_racha': 15,
            'dias_totales': 40,
          },
        }),
        200,
        headers: <String, String>{'content-type': 'application/json'},
      );
    }

    if (ruta == '/api/relajacion/catalogo') {
      return http.Response(
        jsonEncode(<String, dynamic>{
          'catalogo': <Map<String, dynamic>>[
            <String, dynamic>{
              'id': 'respiracion-478',
              'tipo': 'respiracion',
              'titulo': 'Respiración 4-7-8',
              'descripcion': 'Inhala, sostén y exhala.',
              'duracion_seg': 90,
              'pantalla': 'RelajacionRespiracion',
            },
            <String, dynamic>{
              'id': 'estiramiento-escritorio',
              'tipo': 'estiramiento',
              'titulo': 'Pausa activa de escritorio',
              'descripcion': 'Estiramientos sin levantarte.',
              'duracion_seg': 120,
              'pantalla': 'RelajacionEstiramiento',
            },
          ],
        }),
        200,
        headers: <String, String>{'content-type': 'application/json'},
      );
    }

    if (ruta == '/api/relajacion/conteo') {
      return http.Response(
        jsonEncode(<String, dynamic>{'total': 23}),
        200,
        headers: <String, String>{'content-type': 'application/json'},
      );
    }

    if (ruta == '/api/login/mobile') {
      return http.Response(
        jsonEncode(<String, dynamic>{
          'message': 'Login exitoso',
          'token': 'token-de-prueba',
          'usuario': <String, dynamic>{
            'id': 1,
            'nombre': 'Diego Reyes',
            'correo': 'diego@utq.edu.mx',
            'tipo_usuario': 2,
            'onboarding_completo': true,
          },
        }),
        200,
        headers: <String, String>{'content-type': 'application/json'},
      );
    }

    return http.Response('{}', 200, headers: <String, String>{
      'content-type': 'application/json',
    });
  });

  setUpAll(cargarTipografiaNunito);

  setUp(() async {
    almacen = AlmacenMemoria();
    cola = ColaSincronizacion(almacen);

    final api = ApiCliente(
      proveedorToken: () async => 'token-de-prueba',
      cliente: backend(),
      baseUrl: 'https://jorima.test',
    );

    sesion = SesionManager(
      authApi: AuthApi(api),
      almacenSeguro: AlmacenamientoSeguroMemoria(),
    );
    await sesion.restaurar();

    chat = ChatManager(api: ChatApi(api), almacen: almacen, cola: cola);
    racha = StreakManager(api: RachaApi(api), almacen: almacen, cola: cola);
    rutinas = RoutineScheduler(
      api: RutinasApi(api),
      notificaciones: ServicioNotificaciones(),
      almacen: almacen,
      cola: cola,
    );
    tema = TemaController(almacen: almacen);

    final conectividad = ServicioConectividad();
    sincronizador = Sincronizador(
      chat: chat,
      racha: racha,
      rutinas: rutinas,
      conectividad: conectividad,
    );

    // Estado con datos, como al abrir la app con sesión iniciada.
    await racha.cargar();
    await rutinas.cargar();
  });

  /// Monta una pantalla con todo lo que necesita, en tamaño de reloj.
  Future<void> montar(WidgetTester tester, Widget pantalla) async {
    // 220 × 220 px lógicos: el tamaño típico de un Wear OS redondo.
    tester.view.physicalSize = const Size(220, 220);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<SesionManager>.value(value: sesion),
          ChangeNotifierProvider<ChatManager>.value(value: chat),
          ChangeNotifierProvider<StreakManager>.value(value: racha),
          ChangeNotifierProvider<RoutineScheduler>.value(value: rutinas),
          ChangeNotifierProvider<TemaController>.value(value: tema),
          ChangeNotifierProvider<Sincronizador>.value(value: sincronizador),
          Provider<ServicioConectividad>.value(
            value: ServicioConectividad(),
          ),
          Provider<ServicioNotificaciones>.value(
            value: ServicioNotificaciones(),
          ),
        ],
        child: MaterialApp(
          theme: JorimaTema.claro(),
          darkTheme: JorimaTema.oscuro(),
          home: pantalla,
        ),
      ),
    );

    // Se dejan correr las animaciones de entrada, sin `pumpAndSettle` porque
    // hay animaciones que se repiten (el indicador de escritura).
    for (var i = 0; i < 4; i++) {
      await tester.pump(const Duration(milliseconds: 120));
    }
  }

  testWidgets('Pantalla de inicio se monta en 220 px', (tester) async {
    await montar(tester, const PantallaInicio());
    exigirSinErrores(tester);
    expect(find.textContaining('de racha'), findsOneWidget);
  });

  testWidgets('Pantalla de racha se monta en 220 px', (tester) async {
    await montar(tester, const PantallaRacha());
    exigirSinErrores(tester);
    expect(find.text('12'), findsOneWidget);
  });

  testWidgets('Pantalla de chat se monta en 220 px', (tester) async {
    await montar(tester, const PantallaChat());
    exigirSinErrores(tester);
  });

  testWidgets('Pantalla de rutinas se monta en 220 px', (tester) async {
    await montar(tester, const PantallaRutinas());
    exigirSinErrores(tester);
  });

  testWidgets('Pantalla de ajustes se monta en 220 px', (tester) async {
    await montar(tester, const PantallaAjustes());
    exigirSinErrores(tester);
  });

  testWidgets('Pantalla de login se monta en 220 px', (tester) async {
    await montar(tester, const PantallaLogin());
    exigirSinErrores(tester);
  });

  testWidgets('Pantalla de actividad (agua) se monta en 220 px', (tester) async {
    await montar(
      tester,
      const PantallaActividad(actividad: ActividadRelajacion.agua),
    );
    exigirSinErrores(tester);
    expect(find.text('Ya tomé agua'), findsOneWidget);
  });

  testWidgets('el inicio muestra la racha real del backend', (tester) async {
    await montar(tester, const PantallaInicio());

    // 12 días vienen de GET /api/animo/hoy simulado.
    expect(find.text('12'), findsOneWidget);
    expect(find.textContaining('En su maceta'), findsWidgets);
  });

  testWidgets('el chat acepta un mensaje con respuesta rápida', (tester) async {
    await montar(tester, const PantallaChat());

    expect(find.text('Tengo mucho estrés'), findsOneWidget);

    await tester.tap(find.text('Tengo mucho estrés'));
    await tester.pump(const Duration(milliseconds: 200));

    exigirSinErrores(tester);
    // El mensaje quedó como burbuja del usuario.
    expect(chat.mensajes.any((m) => m.esUsuario), isTrue);
  });
}
