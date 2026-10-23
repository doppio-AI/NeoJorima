import '../data/api/modelos.dart';

/// Etapa visible de la planta del reloj (RF-02).
class EtapaPlanta {
  const EtapaPlanta({
    required this.minDias,
    required this.nombre,
    required this.descripcion,
  });

  final int minDias;
  final String nombre;
  final String descripcion;
}

/// Lógica de crecimiento de la planta de la racha.
///
/// Es una clase pura (sin Flutter) para poder probarla: el tamaño de la planta
/// es la parte de RF-02 que el criterio de aceptación exige que sea
/// "proporcional con los datos reales".
///
/// Dos reglas, tomadas del backend (`web/lib/racha.ts`):
///
///  * la planta crece en proporción a la racha, con el tope en
///    [diasParaPleno] días, que es donde ya está "floreciendo";
///  * nunca se encoge por debajo de lo ganado: `racha_raiz` es un piso
///    permanente, así que faltar un día no marchita la planta, sólo la deja
///    crecer más despacio. Es el mismo criterio anti-culpa que usa la web.
class CrecimientoPlanta {
  CrecimientoPlanta._();

  /// Días de racha a partir de los cuales la planta se dibuja al máximo.
  static const int diasParaPleno = 30;

  /// Escala mínima: incluso con racha 0 se ve una semilla, nunca un hueco.
  static const double escalaMinima = 0.45;

  static const List<EtapaPlanta> etapas = <EtapaPlanta>[
    EtapaPlanta(minDias: 0, nombre: 'Semilla', descripcion: 'Todo empieza hoy'),
    EtapaPlanta(minDias: 1, nombre: 'Brote', descripcion: 'Ya germinó'),
    EtapaPlanta(minDias: 3, nombre: 'Planta joven', descripcion: 'Toma forma'),
    EtapaPlanta(minDias: 7, nombre: 'En su maceta', descripcion: 'Una semana entera'),
    EtapaPlanta(minDias: 14, nombre: 'Arbolito', descripcion: 'Dos semanas seguidas'),
    EtapaPlanta(minDias: 30, nombre: 'Floreciendo', descripcion: 'Un mes cuidándote'),
  ];

  /// Progreso de 0 a 1, con el piso permanente de la raíz.
  static double progreso(RachaSnapshot racha) {
    final actual = racha.rachaActual / diasParaPleno;
    final raiz = racha.rachaRaiz / diasParaPleno;
    final valor = actual > raiz ? actual : raiz;
    return valor.clamp(0.0, 1.0);
  }

  /// Factor de tamaño para el dibujo (0.45 a 1.0).
  static double escala(RachaSnapshot racha) =>
      escalaMinima + (1 - escalaMinima) * progreso(racha);

  /// Cuántas hojas dibujar (2 a 10).
  static int hojas(RachaSnapshot racha) => 2 + (progreso(racha) * 8).round();

  static EtapaPlanta etapa(RachaSnapshot racha) {
    var actual = etapas.first;
    for (final etapa in etapas) {
      if (racha.rachaActual >= etapa.minDias) actual = etapa;
    }
    return actual;
  }

  /// Días que faltan para la siguiente etapa, o `null` si ya está al máximo.
  static int? diasParaSiguienteEtapa(RachaSnapshot racha) {
    for (final etapa in etapas) {
      if (racha.rachaActual < etapa.minDias) {
        return etapa.minDias - racha.rachaActual;
      }
    }
    return null;
  }

  /// Texto corto de refuerzo, al estilo de la web.
  static String mensaje(RachaSnapshot racha) {
    if (racha.rachaActual <= 0) {
      return 'Contesta cómo te sientes y nace tu racha';
    }

    final faltan = diasParaSiguienteEtapa(racha);
    if (faltan == null) {
      return 'Creciendo contigo, día a día';
    }

    return faltan == 1 ? 'Falta 1 día para crecer' : 'Faltan $faltan días para crecer';
  }
}
