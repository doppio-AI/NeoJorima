import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/sesion_manager.dart';
import '../../theme/colores.dart';
import '../../theme/tema.dart';
import '../../theme/tipografia.dart';
import '../widgets/avatar_jorima.dart';
import '../widgets/boton_chunky.dart';
import '../widgets/marco_reloj.dart';

/// Pantalla de acceso.
///
/// Se conserva porque es lo único que permite que el reloj obtenga el token
/// que exige el middleware del backend para `/api/*`. Una vez dentro, la
/// sesión queda guardada en el almacén seguro y no se vuelve a pedir.
class PantallaLogin extends StatefulWidget {
  const PantallaLogin({super.key});

  @override
  State<PantallaLogin> createState() => _PantallaLoginState();
}

class _PantallaLoginState extends State<PantallaLogin> {
  final TextEditingController _correo = TextEditingController();
  final TextEditingController _contrasena = TextEditingController();
  final FocusNode _focoCorreo = FocusNode();
  final FocusNode _focoContrasena = FocusNode();
  bool _verContrasena = false;

  /// Campo que la persona está editando, o `null` si ninguno.
  ///
  /// Mientras es `null` los dos campos están en solo lectura y el teclado de
  /// Wear (que ocupa la pantalla entera) no aparece. Así el acceso se ve y se
  /// entiende antes de tocar nada.
  String? _campoActivo;

  @override
  void dispose() {
    _correo.dispose();
    _contrasena.dispose();
    _focoCorreo.dispose();
    _focoContrasena.dispose();
    super.dispose();
  }

  /// Activa un campo y le da el foco después del siguiente fotograma, cuando ya
  /// dejó de ser de solo lectura.
  void _activar(String campo) {
    if (_campoActivo == campo) return;
    setState(() => _campoActivo = campo);

    final foco = campo == 'correo' ? _focoCorreo : _focoContrasena;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) foco.requestFocus();
    });
  }

  Future<void> _entrar() async {
    final sesion = context.read<SesionManager>();
    if (sesion.ocupado) return;

    await sesion.iniciarSesion(
      correo: _correo.text,
      contrasena: _contrasena.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    final sesion = context.watch<SesionManager>();
    final paleta = context.paleta;

    return MarcoReloj(
      mostrarAtras: false,
      desplazable: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const SizedBox(height: 4),
          const Center(child: AvatarJorima(tamano: 52)),
          const SizedBox(height: 8),
          Text(
            'Jorima',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: JorimaTexto.familia,
              fontSize: 20,
              fontWeight: JorimaTexto.extraNegrita,
              color: paleta.primario,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'Tu bienestar, en la muñeca',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: JorimaTexto.familia,
              fontSize: JorimaTexto.micro,
              fontWeight: JorimaTexto.seminegrita,
              color: paleta.textoSecundario,
            ),
          ),
          const SizedBox(height: 10),
          CampoReloj(
            controlador: _correo,
            etiqueta: 'Correo',
            tipoTeclado: TextInputType.emailAddress,
            accion: TextInputAction.next,
            foco: _focoCorreo,
            soloLectura: _campoActivo != 'correo',
            alTocar: () => _activar('correo'),
            alEnviar: () => _activar('contrasena'),
          ),
          const SizedBox(height: 6),
          CampoReloj(
            controlador: _contrasena,
            etiqueta: 'Contraseña',
            oscuro: !_verContrasena,
            accion: TextInputAction.done,
            alEnviar: _entrar,
            foco: _focoContrasena,
            soloLectura: _campoActivo != 'contrasena',
            alTocar: () => _activar('contrasena'),
            sufijo: IconButton(
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
              icon: Icon(
                _verContrasena
                    ? Icons.visibility_off_rounded
                    : Icons.visibility_rounded,
                size: 15,
                color: paleta.textoSecundario,
              ),
              onPressed: () => setState(() => _verContrasena = !_verContrasena),
            ),
          ),
          if (sesion.error != null) ...<Widget>[
            const SizedBox(height: 8),
            PiezasJorima.error(context, sesion.error!),
          ],
          const SizedBox(height: 10),
          BotonChunky(
            etiqueta: 'Entrar',
            icono: Icons.login_rounded,
            cargando: sesion.ocupado,
            onPressed: sesion.ocupado ? null : _entrar,
          ),
          const SizedBox(height: 6),
        ],
      ),
    );
  }
}

/// Campo de texto adaptado al reloj: alto, texto grande y sin adornos.
///
/// Un `TextField` normal de Material es demasiado alto y deja el texto
/// pequeño; en 200 px de ancho hay que ganar cada píxel.
class CampoReloj extends StatelessWidget {
  const CampoReloj({
    super.key,
    required this.controlador,
    required this.etiqueta,
    this.oscuro = false,
    this.tipoTeclado = TextInputType.text,
    this.accion = TextInputAction.next,
    this.alEnviar,
    this.sufijo,
    this.maxLineas = 1,
    this.habilitado = true,
    this.soloLectura = false,
    this.alTocar,
    this.foco,
  });

  final TextEditingController controlador;
  final String etiqueta;
  final bool oscuro;
  final TextInputType tipoTeclado;
  final TextInputAction accion;
  final VoidCallback? alEnviar;
  final Widget? sufijo;
  final int maxLineas;
  final bool habilitado;

  /// Cuando es true el campo no abre el teclado.
  ///
  /// En Wear OS el teclado es **de pantalla completa**: si un campo toma el foco
  /// al abrir la pantalla, tapa toda la interfaz. Por eso los campos del acceso
  /// empiezan en solo lectura y se activan cuando la persona los toca.
  final bool soloLectura;

  final VoidCallback? alTocar;
  final FocusNode? foco;

  @override
  Widget build(BuildContext context) {
    final paleta = context.paleta;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 1),
      decoration: BoxDecoration(
        color: paleta.superficie,
        borderRadius: BorderRadius.circular(JorimaMedidas.radioSm),
        border: Border.all(color: paleta.borde, width: 1.5),
      ),
      child: Row(
        children: <Widget>[
          Expanded(
            child: TextField(
              controller: controlador,
              focusNode: foco,
              obscureText: oscuro,
              enabled: habilitado,
              readOnly: soloLectura,
              onTap: alTocar,
              keyboardType: tipoTeclado,
              textInputAction: accion,
              onSubmitted: alEnviar == null ? null : (_) => alEnviar!(),
              maxLines: maxLineas,
              textCapitalization: TextCapitalization.none,
              autocorrect: false,
              style: TextStyle(
                fontFamily: JorimaTexto.familia,
                fontSize: JorimaTexto.chat,
                fontWeight: JorimaTexto.seminegrita,
                color: paleta.texto,
              ),
              decoration: InputDecoration(
                isDense: true,
                border: InputBorder.none,
                hintText: etiqueta,
                hintStyle: TextStyle(
                  fontFamily: JorimaTexto.familia,
                  fontSize: JorimaTexto.chat,
                  fontWeight: JorimaTexto.normal,
                  color: paleta.textoSecundario.withValues(alpha: 0.8),
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 9),
              ),
            ),
          ),
          if (sufijo != null) sufijo!,
        ],
      ),
    );
  }
}
