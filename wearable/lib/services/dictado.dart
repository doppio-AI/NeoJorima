import 'dart:async';

import 'package:speech_to_text/speech_to_text.dart';

/// Dictado por voz para el chat.
///
/// La Práctica 1 lo pide explícitamente: "dictado por voz para escribir sin
/// teclado". En un reloj de dos pulgadas escribir con el teclado es incómodo, así
/// que el dictado no es un extra, es la forma natural de hablarle a Jorima.
///
/// Si el dispositivo no tiene reconocimiento de voz (o no se concede el
/// micrófono), [disponible] queda en `false` y la pantalla esconde el botón: la
/// app sigue siendo usable escribiendo.
class DictadoServicio {
  DictadoServicio([SpeechToText? motor]) : _motor = motor ?? SpeechToText();

  final SpeechToText _motor;

  bool _disponible = false;
  bool _escuchando = false;
  bool _inicializado = false;

  bool get disponible => _disponible;
  bool get escuchando => _escuchando;

  Future<bool> preparar() async {
    if (_inicializado) return _disponible;

    try {
      _disponible = await _motor.initialize();
    } catch (_) {
      _disponible = false;
    }

    _inicializado = true;
    return _disponible;
  }

  /// Empieza a escuchar.
  ///
  /// [alParcial] recibe el texto provisional mientras se habla y [alFinal] el
  /// texto cerrado; [alTerminar] sirve para apagar el indicador del micrófono.
  Future<void> escuchar({
    required void Function(String texto) alResultado,
    required void Function() alTerminar,
  }) async {
    if (!await preparar()) return;
    if (_motor.isListening) return;

    _escuchando = true;

    await _motor.listen(
      onResult: (resultado) {
        alResultado(resultado.recognizedWords);
        if (resultado.finalResult) {
          _escuchando = false;
          alTerminar();
        }
      },
      listenOptions: SpeechListenOptions(
        // Español de México: el proyecto es de la Universidad Tecnológica de
        // Querétaro y el contenido está en español.
        localeId: 'es_MX',
        partialResults: true,
        cancelOnError: true,
        listenFor: const Duration(seconds: 25),
        // Corta solo al dejar de hablar, sin que el usuario pulse nada.
        pauseFor: const Duration(seconds: 4),
      ),
    );
  }

  Future<void> detener() async {
    if (!_escuchando) return;
    _escuchando = false;
    await _motor.stop();
  }

  Future<void> liberar() async {
    await detener();
  }
}
