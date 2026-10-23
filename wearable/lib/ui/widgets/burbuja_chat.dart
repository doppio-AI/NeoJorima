import 'package:flutter/material.dart';

import '../../data/api/modelos.dart';
import '../../theme/colores.dart';
import '../../theme/tema.dart';
import '../../theme/tipografia.dart';

/// Burbuja de un mensaje del chat.
///
/// Estilo tomado de `globals.css`: el mensaje del **usuario** va en verde
/// turquesa con texto blanco y el del **asistente** en gris claro con borde.
/// La esquina del lado del emisor va menos redondeada para que se entienda
/// quién habla sin necesidad de avatar.
class BurbujaChat extends StatelessWidget {
  const BurbujaChat({super.key, required this.mensaje});

  final MensajeChat mensaje;

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;

    final esUsuario = mensaje.esUsuario;

    final fondo = esUsuario
        ? paleta.secundario
        : (paleta.esOscura ? paleta.superficie : const Color(0xFFF1F4F6));

    final colorTexto = esUsuario
        ? Colors.white
        : (paleta.esOscura ? paleta.texto : JorimaColores.texto);

    const radio = JorimaMedidas.radioMd;

    return Align(
      alignment: esUsuario ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).shortestSide * 0.78,
        ),
        margin: const EdgeInsets.symmetric(vertical: 2),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
        decoration: BoxDecoration(
          color: fondo,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(radio),
            topRight: const Radius.circular(radio),
            bottomLeft: Radius.circular(esUsuario ? radio : 5),
            bottomRight: Radius.circular(esUsuario ? 5 : radio),
          ),
          border: esUsuario
              ? null
              : Border.all(color: paleta.borde, width: 1.2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Text(
              mensaje.texto,
              style: TextStyle(
                fontFamily: JorimaTexto.familia,
                // RF-01 pide respuestas legibles en pantalla pequeña.
                fontSize: JorimaTexto.chat,
                fontWeight: JorimaTexto.normal,
                height: 1.24,
                color: colorTexto,
              ),
            ),
            if (mensaje.estado != EstadoMensaje.enviado) ...<Widget>[
              const SizedBox(height: 2),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  Icon(
                    mensaje.estado == EstadoMensaje.pendiente
                        ? Icons.schedule_rounded
                        : Icons.error_outline_rounded,
                    size: 11,
                    color: mensaje.estado == EstadoMensaje.pendiente
                        ? JorimaColores.solSombra
                        : JorimaColores.coral,
                  ),
                  const SizedBox(width: 3),
                  Text(
                    mensaje.estado == EstadoMensaje.pendiente
                        ? 'Se enviará al reconectar'
                        : 'No se pudo enviar',
                    style: TextStyle(
                      fontFamily: JorimaTexto.familia,
                      fontSize: 9.5,
                      fontWeight: JorimaTexto.seminegrita,
                      color: mensaje.estado == EstadoMensaje.pendiente
                          ? JorimaColores.solSombra
                          : JorimaColores.coralSombra,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
