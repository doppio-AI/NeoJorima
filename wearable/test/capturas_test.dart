import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
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
import 'package:jorima_wearable/ui/pantallas/pantalla_actividad.dart';import 'package:jorima_wearable/ui/pantallas/pantalla_ajustes.dart';
import 'package:jorima_wearable/ui/pantallas/pantalla_chat.dart';
import 'package:jorima_wearable/ui/pantallas/pantalla_inicio.dart';
import 'package:jorima_wearable/ui/pantallas/pantalla_login.dart';
import 'package:jorima_wearable/ui/pantallas/pantalla_racha.dart';
import 'package:jorima_wearable/ui/pantallas/pantalla_rutinas.dart';
import 'package:jorima_wearable/ui/widgets/avatar_jorima.dart';
import 'package:provider/provider.dart';

/// Genera capturas reales de la app para la evidencia del reporte.
///
/// No hay emulador de Wear OS en este equipo, así que las capturas se obtienen
/// **renderizando de verdad** cada pantalla con el motor de Flutter, a
/// 300 × 300 px (el tamaño de un reloj redondo), con las fuentes y las imágenes
/// reales del proyecto. No son maquetas: es el mismo árbol de widgets que corre
/// en el reloj.
///
/// Uso:
///   CAPTURAS=1 flutter test test/capturas_test.dart
///
/// Sin la variable de entorno la prueba no escribe nada, para no ensuciar el
/// repositorio en las corridas normales.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final generar = Platform.environment['CAPTURAS'] == '1';

  setUpAll(() async {
    final cargador = FontLoader('Nunito');
    for (final peso in <String>['Regular', 'SemiBold', 'Bold', 'ExtraBold']) {
      cargador.addFont(rootBundle.load('assets/fonts/Nunito-$peso.ttf'));
    }
    await cargador.load();

    // La tipografía de iconos de Material no se carga sola en el entorno de
    // pruebas; sin ella los iconos salen como cuadros vacíos en las capturas.
    await _cargarIconosMaterial();
  });

  testWidgets('genera las capturas de las pantallas', (tester) async {
    if (!generar) return;

    final dependencias = await _montarDependencias();

    final directorio = Directory('${Directory.current.path}/docs/capturas');
    if (!directorio.existsSync()) directorio.createSync(recursive: true);

    // El chat se llena con la conversación de ejemplo, para que se vean las
    // burbujas del usuario y del asistente.
    await dependencias.chat.enviar('Tengo mucho estrés antes de la junta');
    await dependencias.chat.enviar('¿Qué puedo hacer ahora?');

    final pantallas = <String, Widget>{
      '01-inicio': const PantallaInicio(),
      '02-racha': const PantallaRacha(),
      '03-chat': const PantallaChat(),
      '04-rutinas': const PantallaRutinas(),
      '05-actividad-respiracion': const PantallaActividad(
        actividad: ActividadRelajacion(
          id: 'respiracion-478',
          tipo: TipoRutina.respiracion,
          titulo: 'Respiración 4-7-8',
          descripcion: 'Inhala, sostén y exhala.',
          duracionSeg: 90,
          pantalla: 'RelajacionRespiracion',
        ),
      ),
      '06-ajustes': const PantallaAjustes(),
      '07-login': const PantallaLogin(),
    };

    for (final entrada in pantallas.entries) {
      await _capturar(
        tester,
        entrada.value,
        dependencias,
        entrada.key,
        oscuro: false,
      );
      await _capturar(
        tester,
        entrada.value,
        dependencias,
        '${entrada.key}-oscuro',
        oscuro: true,
      );
    }

    // ignore: avoid_print
    print('Capturas escritas en ${directorio.path}');
  });
}

/// Carga la tipografía de iconos de Material desde el propio SDK de Flutter.
Future<void> _cargarIconosMaterial() async {
  final raiz = Platform.environment['FLUTTER_ROOT'] ??
      Platform.environment['FLUTTER_SDK'] ??
      r'C:\flutter';

  final archivo = File(
    '$raiz/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf',
  );

  if (!archivo.existsSync()) return;

  final cargador = FontLoader('MaterialIcons');
  cargador.addFont(
    Future<ByteData>.value(ByteData.sublistView(archivo.readAsBytesSync())),
  );
  await cargador.load();
}

class _Dependencias {
  _Dependencias({
    required this.sesion,
    required this.chat,
    required this.racha,
    required this.rutinas,
    required this.tema,
    required this.sincronizador,
    required this.conectividad,
    required this.notificaciones,
  });

  final SesionManager sesion;
  final ChatManager chat;
  final StreakManager racha;
  final RoutineScheduler rutinas;
  final TemaController tema;
  final Sincronizador sincronizador;
  final ServicioConectividad conectividad;
  final ServicioNotificaciones notificaciones;
}

Future<_Dependencias> _montarDependencias() async {
  final almacen = AlmacenMemoria();
  final cola = ColaSincronizacion(almacen);

  final api = ApiCliente(
    proveedorToken: () async => 'token-de-ejemplo',
    cliente: MockClient((peticion) async {
      final ruta = peticion.url.path;

      Map<String, dynamic> cuerpo() {
        if (ruta == '/api/animo/hoy') {
          return <String, dynamic>{
            'ya_contesto': true,
            'estado': 'bien',
            'racha': <String, dynamic>{
              'racha_actual': 12,
              'racha_raiz': 4,
              'mejor_racha': 15,
              'dias_totales': 40,
            },
          };
        }

        if (ruta == '/api/chat') {
          final mensaje = jsonDecode(peticion.body) as Map<String, dynamic>;
          final texto = (mensaje['mensaje'] as String?) ?? '';
          final respuesta = texto.contains('junta')
              ? 'Antes de esa junta, respira conmigo: inhala en cuatro, sostén siete y exhala en ocho.'
              : 'Vamos a bajar el ritmo juntos. Una pausa de 90 segundos ya cambia el día.';

          return <String, dynamic>{
            'conversacion_id': 1,
            'respuesta': respuesta,
            'alerta': false,
          };
        }

        if (ruta == '/api/relajacion/catalogo') {
          return <String, dynamic>{
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
          };
        }

        if (ruta == '/api/relajacion/conteo') {
          return <String, dynamic>{'total': 23};
        }

        return <String, dynamic>{};
      }

      return http.Response(
        jsonEncode(cuerpo()),
        200,
        headers: <String, String>{'content-type': 'application/json'},
      );
    }),
    baseUrl: 'https://jorima.test',
  );

  final sesion = SesionManager(
    authApi: AuthApi(api),
    almacenSeguro: AlmacenamientoSeguroMemoria(),
  );
  await sesion.restaurar();

  final chat = ChatManager(api: ChatApi(api), almacen: almacen, cola: cola);
  final racha = StreakManager(api: RachaApi(api), almacen: almacen, cola: cola);
  final notificaciones = ServicioNotificaciones();
  final rutinas = RoutineScheduler(
    api: RutinasApi(api),
    notificaciones: notificaciones,
    almacen: almacen,
    cola: cola,
  );
  final tema = TemaController(almacen: almacen);
  final conectividad = ServicioConectividad();
  final sincronizador = Sincronizador(
    chat: chat,
    racha: racha,
    rutinas: rutinas,
    conectividad: conectividad,
  );

  await racha.cargar();
  await rutinas.cargar();

  return _Dependencias(
    sesion: sesion,
    chat: chat,
    racha: racha,
    rutinas: rutinas,
    tema: tema,
    sincronizador: sincronizador,
    conectividad: conectividad,
    notificaciones: notificaciones,
  );
}

/// Dibuja una pantalla como se vería en un reloj redondo y la guarda en PNG.
Future<void> _capturar(
  WidgetTester tester,
  Widget pantalla,
  _Dependencias dependencias,
  String nombre, {
  required bool oscuro,
}) async {
  const lado = 300.0;
  final clave = GlobalKey();

  tester.view.physicalSize = const Size(lado + 40, lado + 40);
  tester.view.devicePixelRatio = 1.0;

  await tester.pumpWidget(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<SesionManager>.value(value: dependencias.sesion),
        ChangeNotifierProvider<ChatManager>.value(value: dependencias.chat),
        ChangeNotifierProvider<StreakManager>.value(value: dependencias.racha),
        ChangeNotifierProvider<RoutineScheduler>.value(value: dependencias.rutinas),
        ChangeNotifierProvider<TemaController>.value(value: dependencias.tema),
        ChangeNotifierProvider<Sincronizador>.value(value: dependencias.sincronizador),
        Provider<ServicioConectividad>.value(value: dependencias.conectividad),
        Provider<ServicioNotificaciones>.value(value: dependencias.notificaciones),
      ],
      child: RepaintBoundary(
        key: clave,
        child: Container(
          color: const Color(0xFF0A0E17),
          alignment: Alignment.center,
          child: ClipOval(
            child: SizedBox(
              width: lado,
              height: lado,
              child: MediaQuery(
                data: const MediaQueryData(
                  size: Size(lado, lado),
                  devicePixelRatio: 1,
                ),
                child: MaterialApp(
                  debugShowCheckedModeBanner: false,
                  theme: JorimaTema.claro(),
                  darkTheme: JorimaTema.oscuro(),
                  themeMode: oscuro ? ThemeMode.dark : ThemeMode.light,
                  home: pantalla,
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );

  // Se dejan correr las animaciones de entrada.
  for (var i = 0; i < 6; i++) {
    await tester.pump(const Duration(milliseconds: 120));
  }

  // Los avatares son imágenes: hay que decodificarlas antes de capturar o la
  // captura sale con el círculo vacío.
  await tester.runAsync(() async {
    final contexto = tester.element(find.byType(MaterialApp));
    for (final archivo in AvatarJorima.archivos.values.toSet()) {
      await precacheImage(AssetImage(archivo), contexto);
    }
  });
  await tester.pump(const Duration(milliseconds: 120));

  final frontera = clave.currentContext!.findRenderObject()! as RenderRepaintBoundary;

  final bytes = await tester.runAsync(() async {
    final imagen = await frontera.toImage(pixelRatio: 3);
    final datos = await imagen.toByteData(format: ui.ImageByteFormat.png);
    return datos;
  });

  final archivo = File(
    '${Directory.current.path}/docs/capturas/$nombre.png',
  );
  archivo.writeAsBytesSync(bytes!.buffer.asUint8List());

  tester.view.resetPhysicalSize();
  tester.view.resetDevicePixelRatio();
}
