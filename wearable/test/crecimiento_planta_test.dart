import 'package:flutter_test/flutter_test.dart';
import 'package:jorima_wearable/data/api/modelos.dart';
import 'package:jorima_wearable/state/crecimiento_planta.dart';

/// Pruebas de la lógica de crecimiento de la planta (RF-02).
///
/// Es la parte de RF-02 que el criterio de aceptación exige verificar: "la
/// planta cambia de tamaño de forma proporcional con los datos reales".
void main() {
  group('CrecimientoPlanta.progreso', () {
    test('sin racha no hay progreso', () {
      expect(CrecimientoPlanta.progreso(RachaSnapshot.vacia), 0.0);
    });

    test('crece de forma proporcional a la racha', () {
      final tresDias = CrecimientoPlanta.progreso(
        const RachaSnapshot(rachaActual: 3, rachaRaiz: 0, mejorRacha: 3, diasTotales: 3),
      );
      final quinceDias = CrecimientoPlanta.progreso(
        const RachaSnapshot(rachaActual: 15, rachaRaiz: 0, mejorRacha: 15, diasTotales: 15),
      );

      expect(tresDias, closeTo(3 / 30, 0.0001));
      expect(quinceDias, closeTo(0.5, 0.0001));
      expect(quinceDias, greaterThan(tresDias));
    });

    test('se topa en 1 al llegar a la etapa de pleno', () {
      final racha = CrecimientoPlanta.progreso(
        const RachaSnapshot(rachaActual: 90, rachaRaiz: 0, mejorRacha: 90, diasTotales: 90),
      );
      expect(racha, 1.0);
    });

    test('la raíz es un piso: no se encoge por debajo de lo ganado', () {
      // Caso real del backend: se faltó un día, así que la racha vuelve a
      // raiz + 1 en lugar de reiniciarse a cero.
      const conRaiz = RachaSnapshot(
        rachaActual: 1,
        rachaRaiz: 21,
        mejorRacha: 40,
        diasTotales: 60,
      );

      final progreso = CrecimientoPlanta.progreso(conRaiz);
      expect(progreso, closeTo(21 / 30, 0.0001));
      expect(progreso, greaterThan(1 / 30));
    });
  });

  group('CrecimientoPlanta.escala', () {
    test('nunca baja de la escala mínima (la semilla siempre se ve)', () {
      expect(
        CrecimientoPlanta.escala(RachaSnapshot.vacia),
        CrecimientoPlanta.escalaMinima,
      );
    });

    test('la escala crece con la racha y no pasa de 1', () {
      const cinco = RachaSnapshot(rachaActual: 5, rachaRaiz: 0, mejorRacha: 5, diasTotales: 5);
      const treinta = RachaSnapshot(rachaActual: 30, rachaRaiz: 0, mejorRacha: 30, diasTotales: 30);
      const cien = RachaSnapshot(rachaActual: 100, rachaRaiz: 0, mejorRacha: 100, diasTotales: 100);

      expect(CrecimientoPlanta.escala(cinco), lessThan(CrecimientoPlanta.escala(treinta)));
      expect(CrecimientoPlanta.escala(treinta), 1.0);
      expect(CrecimientoPlanta.escala(cien), 1.0);
    });
  });

  group('CrecimientoPlanta.hojas', () {
    test('siempre dibuja al menos dos hojas', () {
      expect(CrecimientoPlanta.hojas(RachaSnapshot.vacia), 2);
    });

    test('el número de hojas crece con la racha y está acotado', () {
      const diez = RachaSnapshot(rachaActual: 10, rachaRaiz: 0, mejorRacha: 10, diasTotales: 10);
      const cincuenta = RachaSnapshot(rachaActual: 50, rachaRaiz: 0, mejorRacha: 50, diasTotales: 50);

      expect(CrecimientoPlanta.hojas(RachaSnapshot.vacia), 2);
      expect(CrecimientoPlanta.hojas(diez), greaterThan(2));
      expect(CrecimientoPlanta.hojas(cincuenta), 10);
    });
  });

  group('CrecimientoPlanta.etapa', () {
    test('la etapa depende de la racha', () {
      expect(CrecimientoPlanta.etapa(RachaSnapshot.vacia).nombre, 'Semilla');
      expect(
        CrecimientoPlanta.etapa(
          const RachaSnapshot(rachaActual: 1, rachaRaiz: 0, mejorRacha: 1, diasTotales: 1),
        ).nombre,
        'Brote',
      );
      expect(
        CrecimientoPlanta.etapa(
          const RachaSnapshot(rachaActual: 30, rachaRaiz: 0, mejorRacha: 30, diasTotales: 30),
        ).nombre,
        'Floreciendo',
      );
    });

    test('los días que faltan para la siguiente etapa son correctos', () {
      expect(
        CrecimientoPlanta.diasParaSiguienteEtapa(
          const RachaSnapshot(rachaActual: 1, rachaRaiz: 0, mejorRacha: 1, diasTotales: 1),
        ),
        2, // de 1 a 3 días
      );

      expect(
        CrecimientoPlanta.diasParaSiguienteEtapa(
          const RachaSnapshot(rachaActual: 30, rachaRaiz: 0, mejorRacha: 30, diasTotales: 30),
        ),
        isNull,
      );
    });
  });

  group('RachaSnapshot.desdeJson', () {
    test('lee la forma exacta que devuelve GET /api/animo/hoy', () {
      final racha = RachaSnapshot.desdeJson(<String, dynamic>{
        'racha_actual': 12,
        'racha_raiz': 4,
        'mejor_racha': 15,
        'dias_totales': 40,
      });

      expect(racha.rachaActual, 12);
      expect(racha.rachaRaiz, 4);
      expect(racha.mejorRacha, 15);
      expect(racha.diasTotales, 40);
    });

    test('es tolerante a nulos y a datos ausentes', () {
      final racha = RachaSnapshot.desdeJson(<String, dynamic>{});
      expect(racha.rachaActual, 0);
      expect(racha.rachaRaiz, 0);
      expect(racha.mejorRacha, 0);
      expect(racha.diasTotales, 0);
    });
  });
}
