import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../services/dictado.dart';
import '../../state/chat_manager.dart';
import '../../theme/colores.dart';
import '../../theme/tema.dart';
import '../../theme/tipografia.dart';
import '../widgets/burbuja_chat.dart';
import '../widgets/indicador_escritura.dart';
import '../widgets/marco_reloj.dart';
import 'pantalla_login.dart' show CampoReloj;

/// Chat con el AI Assistant (RF-01).
///
/// Criterio de aceptación de RF-01: "el usuario inicia la conversación desde la
/// pantalla principal, envía un mensaje breve y lee la respuesta real de la API
/// en pantalla pequeña". Aquí las respuestas son reales: vienen de
/// `POST /api/chat`, que por dentro usa el modelo de lenguaje del backend.
class PantallaChat extends StatefulWidget {
  const PantallaChat({super.key});

  @override
  State<PantallaChat> createState() => _PantallaChatState();
}

class _PantallaChatState extends State<PantallaChat> {
  final TextEditingController _texto = TextEditingController();
  final DictadoServicio _dictado = DictadoServicio();

  bool _escuchando = false;

  /// Respuestas rápidas: en el reloj escribir es lento, así que la mayoría de
  /// interacciones empiezan con un toque.
  static const List<String> _respuestasRapidas = <String>[
    'Tengo mucho estrés',
    'Necesito una pausa',
    'No puedo dormir',
  ];

  @override
  void initState() {
    super.initState();
    _dictado.preparar();
  }

  @override
  void dispose() {
    _texto.dispose();
    _dictado.liberar();
    super.dispose();
  }

  Future<void> _enviar([String? sugerido]) async {
    final chat = context.read<ChatManager>();
    final texto = sugerido ?? _texto.text;

    if (texto.trim().isEmpty || chat.enviando) return;

    _texto.clear();
    await chat.enviar(texto);
  }

  Future<void> _alternarDictado() async {
    if (!mounted) return;

    if (_escuchando) {
      await _dictado.detener();
      if (!mounted) return;
      setState(() => _escuchando = false);
      return;
    }

    final disponible = await _dictado.preparar();
    if (!mounted) return;

    if (!disponible) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Este reloj no tiene dictado disponible'),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    HapticFeedback.mediumImpact();
    setState(() => _escuchando = true);

    await _dictado.escuchar(
      alResultado: (texto) {
        if (!mounted) return;
        setState(() => _texto.text = texto);
      },
      alTerminar: () {
        if (!mounted) return;
        setState(() => _escuchando = false);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;
    final chat = context.watch<ChatManager>();

    // reverse: true -> el mensaje más reciente queda abajo y visible sin
    // necesidad de desplazar el scroll a mano.
    final elementos = <Widget>[
      if (chat.enviando) const Padding(
        padding: EdgeInsets.symmetric(vertical: 2),
        child: IndicadorEscritura(),
      ),
      ...chat.mensajes.reversed.map(
        (mensaje) => BurbujaChat(mensaje: mensaje),
      ),
    ];

    return MarcoReloj(
      titulo: 'Jorima',
      accionFinal: SizedBox(
        width: 34,
        height: 34,
        child: Material(
          color: paleta.superficie,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(JorimaMedidas.radioSm),
            side: BorderSide(color: paleta.borde, width: 1.5),
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(JorimaMedidas.radioSm),
            onTap: () => _confirmarLimpiar(context),
            child: Icon(
              Icons.delete_sweep_rounded,
              size: 18,
              color: paleta.textoSecundario,
            ),
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          if (chat.sinConexion) ...<Widget>[
            PiezasJorima.sinConexion(
              context,
              texto: 'Sin conexión: tu mensaje se enviará después',
            ),
            const SizedBox(height: 4),
          ],

          Expanded(
            child: chat.vacio && !chat.enviando
                ? _Vacio(paleta: paleta)
                : ListView(
                    reverse: true,
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    physics: const ClampingScrollPhysics(),
                    children: elementos,
                  ),
          ),

          if (chat.error != null) ...<Widget>[
            const SizedBox(height: 3),
            PiezasJorima.error(context, chat.error!),
          ],

          // Respuestas rápidas: sólo cuando hay poco contexto acumulado.
          if (chat.mensajes.length < 2) ...<Widget>[
            const SizedBox(height: 4),
            SizedBox(
              height: 26,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _respuestasRapidas.length,
                separatorBuilder: (_, _) => const SizedBox(width: 4),
                itemBuilder: (context, i) {
                  final sugerencia = _respuestasRapidas[i];
                  return GestureDetector(
                    onTap: () => _enviar(sugerencia),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: paleta.secundario.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: paleta.secundario.withValues(alpha: 0.45),
                          width: 1,
                        ),
                      ),
                      child: Text(
                        sugerencia,
                        style: TextStyle(
                          fontFamily: JorimaTexto.familia,
                          fontSize: 10.5,
                          fontWeight: JorimaTexto.negrita,
                          color: paleta.secundarioSombra,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],

          const SizedBox(height: 4),

          // ── Entrada: dictado + texto + enviar ──
          Row(
            children: <Widget>[
              _BotonRedondo(
                icono: _escuchando ? Icons.stop_rounded : Icons.mic_rounded,
                color: _escuchando ? JorimaColores.coral : paleta.secundario,
                onTap: _alternarDictado,
                pulsando: _escuchando,
              ),
              const SizedBox(width: 4),
              Expanded(
                child: CampoReloj(
                  controlador: _texto,
                  etiqueta: _escuchando ? 'Escuchando…' : 'Escribe a Jorima',
                  accion: TextInputAction.send,
                  alEnviar: _enviar,
                  habilitado: !chat.enviando,
                  sufijo: chat.enviando
                      ? null
                      : IconButton(
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(
                            minWidth: 30,
                            minHeight: 30,
                          ),
                          icon: Icon(
                            Icons.send_rounded,
                            size: 17,
                            color: paleta.primario,
                          ),
                          onPressed: _enviar,
                        ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _confirmarLimpiar(BuildContext context) async {
    final chat = context.read<ChatManager>();
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('¿Borrar la conversación?'),
        titleTextStyle: Theme.of(context).textTheme.titleMedium,
        content: const Text('Se borran los mensajes guardados en el reloj.'),
        contentTextStyle: Theme.of(context).textTheme.bodyMedium,
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Sí'),
          ),
        ],
      ),
    );

    if (confirmar == true) await chat.limpiar();
  }
}

class _Vacio extends StatelessWidget {
  const _Vacio({required this.paleta});

  final PaletaJorima paleta;

  @override
  Widget build(BuildContext context) {
    // FittedBox: en los relojes más pequeños el bloque no cabe a tamaño
    // natural; se encoge en lugar de desbordarse.
    return Center(
      child: FittedBox(
        fit: BoxFit.scaleDown,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
          Icon(
            Icons.chat_bubble_outline_rounded,
            size: 26,
            color: paleta.secundario,
          ),
          const SizedBox(height: 6),
          Text(
            'Cuéntame cómo va tu día',
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontFamily: JorimaTexto.familia,
              fontSize: JorimaTexto.pequeno,
              fontWeight: JorimaTexto.negrita,
              color: paleta.texto,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'Respuestas cortas, para leerlas de un vistazo',
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontFamily: JorimaTexto.familia,
              fontSize: 10.5,
              fontWeight: JorimaTexto.normal,
              color: paleta.textoSecundario,
            ),
          ),
          ],
        ),
      ),
    );
  }
}

class _BotonRedondo extends StatelessWidget {
  const _BotonRedondo({
    required this.icono,
    required this.color,
    required this.onTap,
    this.pulsando = false,
  });

  final IconData icono;
  final Color color;
  final VoidCallback onTap;
  final bool pulsando;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: color.withValues(alpha: pulsando ? 0.95 : 0.16),
          shape: BoxShape.circle,
          border: Border.all(color: color, width: 1.6),
        ),
        child: Icon(
          icono,
          size: 16,
          color: pulsando ? Colors.white : color,
        ),
      ),
    );
  }
}
