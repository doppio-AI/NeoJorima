import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'data/local/almacen_local.dart';
import 'services/conectividad.dart';
import 'services/notificaciones.dart';
import 'state/chat_manager.dart';
import 'state/routine_scheduler.dart';
import 'state/sesion_manager.dart';
import 'state/sincronizador.dart';
import 'state/streak_manager.dart';
import 'state/tema_controller.dart';
import 'theme/colores.dart';
import 'theme/tema.dart';
import 'ui/pantallas/pantalla_actividad.dart';
import 'ui/pantallas/pantalla_ajustes.dart';
import 'ui/pantallas/pantalla_chat.dart';
import 'ui/pantallas/pantalla_inicio.dart';
import 'ui/pantallas/pantalla_login.dart';
import 'ui/pantallas/pantalla_racha.dart';
import 'ui/pantallas/pantalla_rutinas.dart';
import 'data/api/modelos.dart';

/// Todo lo que la app necesita, ya construido.
///
/// Se arma una sola vez en `main.dart` y se inyecta por `Provider`, para que las
/// pantallas no construyan servicios ni clientes de API por su cuenta.
class Dependencias {
  const Dependencias({
    required this.sesion,
    required this.chat,
    required this.racha,
    required this.rutinas,
    required this.tema,
    required this.sincronizador,
    required this.conectividad,
    required this.notificaciones,
    required this.almacen,
  });

  final SesionManager sesion;
  final ChatManager chat;
  final StreakManager racha;
  final RoutineScheduler rutinas;
  final TemaController tema;
  final Sincronizador sincronizador;
  final ServicioConectividad conectividad;
  final ServicioNotificaciones notificaciones;
  final AlmacenLocal almacen;
}

/// Raíz de la aplicación.
class JorimaWearableApp extends StatelessWidget {
  const JorimaWearableApp({
    super.key,
    required this.dependencias,
    required this.navegadorClave,
  });

  final Dependencias dependencias;
  final GlobalKey<NavigatorState> navegadorClave;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<SesionManager>.value(value: dependencias.sesion),
        ChangeNotifierProvider<ChatManager>.value(value: dependencias.chat),
        ChangeNotifierProvider<StreakManager>.value(value: dependencias.racha),
        ChangeNotifierProvider<RoutineScheduler>.value(value: dependencias.rutinas),
        ChangeNotifierProvider<TemaController>.value(value: dependencias.tema),
        ChangeNotifierProvider<Sincronizador>.value(value: dependencias.sincronizador),
        Provider<ServicioConectividad>.value(value: dependencias.conectividad),
        Provider<ServicioNotificaciones>.value(value: dependencias.notificaciones),
        Provider<AlmacenLocal>.value(value: dependencias.almacen),
      ],
      child: Consumer<TemaController>(
        builder: (context, tema, _) {
          return MaterialApp(
            title: 'Jorima Wearable',
            navigatorKey: navegadorClave,
            debugShowCheckedModeBanner: false,
            theme: JorimaTema.claro(),
            darkTheme: JorimaTema.oscuro(),
            themeMode: tema.modo,
            home: const _PuertaSesion(),
            routes: <String, WidgetBuilder>{
              '/inicio': (_) => const PantallaInicio(),
              '/login': (_) => const PantallaLogin(),
              '/chat': (_) => const PantallaChat(),
              '/racha': (_) => const PantallaRacha(),
              '/rutinas': (_) => const PantallaRutinas(),
              '/ajustes': (_) => const PantallaAjustes(),
            },
            onGenerateRoute: _generarRuta,
            builder: (context, child) {
              // En un reloj un escalado de texto enorme rompe las pantallas;
              // se acota sin impedir el ajuste de accesibilidad.
              final media = MediaQuery.of(context);
              return MediaQuery(
                data: media.copyWith(
                  textScaler: media.textScaler.clamp(
                    minScaleFactor: 0.95,
                    maxScaleFactor: 1.15,
                  ),
                ),
                child: child ?? const SizedBox.shrink(),
              );
            },
          );
        },
      ),
    );
  }

  /// Ruta de la actividad, que llega con la actividad como argumento.
  ///
  /// Es la que se abre al tocar el aviso de RF-03.
  Route<dynamic>? _generarRuta(RouteSettings ajustes) {
    if (ajustes.name == '/rutina') {
      final argumento = ajustes.arguments;
      final actividad = argumento is ActividadRelajacion
          ? argumento
          : ActividadRelajacion.agua;

      return MaterialPageRoute<void>(
        settings: ajustes,
        builder: (_) => PantallaActividad(actividad: actividad),
      );
    }

    return null;
  }
}

/// Decide la primera pantalla según la sesión.
///
/// Mientras se restauran los datos muestra una pantalla de carga; después manda
/// al inicio si hay token guardado y al acceso si no lo hay.
class _PuertaSesion extends StatelessWidget {
  const _PuertaSesion();

  @override
  Widget build(BuildContext context) {
    final sesion = context.watch<SesionManager>();

    switch (sesion.estado) {
      case EstadoSesion.autenticada:
        return const PantallaInicio();
      case EstadoSesion.desconocida:
      case EstadoSesion.autenticando:
        return const _Cargando();
      case EstadoSesion.sinSesion:
        return const PantallaLogin();
    }
  }
}

class _Cargando extends StatelessWidget {
  const _Cargando();

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;

    return Scaffold(
      backgroundColor: paleta.fondo,
      body: Center(
        child: SizedBox(
          width: 22,
          height: 22,
          child: CircularProgressIndicator(
            strokeWidth: 2.4,
            valueColor: AlwaysStoppedAnimation<Color>(paleta.secundario),
          ),
        ),
      ),
    );
  }
}
