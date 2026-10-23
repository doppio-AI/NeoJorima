import 'package:flutter_test/flutter_test.dart';
import 'package:jorima_wearable/data/api/modelos.dart';
import 'package:jorima_wearable/data/local/almacen_local.dart';
import 'package:jorima_wearable/services/almacenamiento_seguro.dart';
import 'package:jorima_wearable/services/cifrado_local.dart';

/// Pruebas del cifrado en reposo.
///
/// La Práctica 2 pide que las conversaciones "se guarden pocas y cifradas".
/// Esta prueba comprueba la parte de cifrado sobre el mismo decorador que usa
/// la app en producción, así el requisito no queda sólo escrito.
void main() {
  late AlmacenamientoSeguro almacenSeguro;
  late CifradoLocal cifrado;

  setUp(() {
    almacenSeguro = AlmacenamientoSeguroMemoria();
    cifrado = CifradoLocal(almacenSeguro);
  });

  group('CifradoLocal', () {
    test('cifra y descifra dejando el texto original', () async {
      const original = 'Hoy me sentí muy ansioso antes de la junta.';
      final cifradoTexto = await cifrado.cifrar(original);

      expect(cifradoTexto, isNot(contains('ansioso')));
      expect(await cifrado.descifrar(cifradoTexto), original);
    });

    test('usa una IV distinta por mensaje: el mismo texto no se repite', () async {
      const original = 'Necesito una pausa';
      final uno = await cifrado.cifrar(original);
      final dos = await cifrado.cifrar(original);

      expect(uno, isNot(equals(dos)));
      expect(await cifrado.descifrar(uno), original);
      expect(await cifrado.descifrar(dos), original);
    });

    test('la clave se guarda en el almacén seguro y se reutiliza', () async {
      final primero = await cifrado.cifrar('hola');

      // Otro servicio con el mismo almacén debe poder descifrar lo anterior:
      // la clave no vive en memoria, vive en el almacén seguro.
      final otro = CifradoLocal(almacenSeguro);
      expect(await otro.descifrar(primero), 'hola');
    });

    test('un dato corrupto devuelve vacío en vez de lanzar una excepción', () async {
      expect(await cifrado.descifrar('esto-no-es-cifrado'), '');
      expect(await cifrado.descifrar(''), '');
    });
  });

  group('AlmacenCifrado', () {
    test('no deja texto plano de los mensajes en el almacén de abajo', () async {
      final interno = AlmacenMemoria();
      final almacen = AlmacenCifrado(interno, cifrado);

      await almacen.agregarMensaje(
        MensajeChat(
          id: 0,
          role: 'user',
          texto: 'me siento agotado',
          fecha: DateTime(2026, 10, 20),
        ),
      );

      // Lo que se guardó de verdad...
      final guardados = await interno.mensajes();
      expect(guardados, hasLength(1));
      expect(guardados.first.texto, isNot(contains('agotado')));

      // ...y lo que ve la app al leer.
      final leidos = await almacen.mensajes();
      expect(leidos.single.texto, 'me siento agotado');
    });

    test('recorta la conversación a los últimos mensajes', () async {
      final almacen = AlmacenCifrado(AlmacenMemoria(), cifrado);

      for (var i = 0; i < 30; i++) {
        await almacen.agregarMensaje(
          MensajeChat(
            id: 0,
            role: i.isEven ? 'user' : 'assistant',
            texto: 'mensaje $i',
            fecha: DateTime(2026, 10, 20, 10, i),
          ),
        );
      }

      await almacen.recortarMensajes(20);

      final leidos = await almacen.mensajes();
      expect(leidos, hasLength(20));
      expect(leidos.first.texto, 'mensaje 10');
      expect(leidos.last.texto, 'mensaje 29');
    });
  });

  group('AlmacenMemoria (cola de sincronización)', () {
    test('encola por tipo y respeta el orden de llegada', () async {
      final almacen = AlmacenMemoria();

      await almacen.encolar(TipoCola.checkInAnimo, <String, dynamic>{'estado': 'bien'});
      await almacen.encolar(TipoCola.sesionRelajacion, <String, dynamic>{'tipo': 'respiracion'});
      await almacen.encolar(TipoCola.checkInAnimo, <String, dynamic>{'estado': 'regular'});

      final checkIns = await almacen.pendientesPorTipo(TipoCola.checkInAnimo);
      expect(checkIns, hasLength(2));
      expect(checkIns.first.payload['estado'], 'bien');
      expect(checkIns.last.payload['estado'], 'regular');
      expect(await almacen.totalEnCola(), 3);

      await almacen.borrarDeCola(checkIns.first.id);
      expect(await almacen.totalEnCola(), 2);
    });
  });
}
