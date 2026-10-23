/// Modelos de datos del wearable.
///
/// Todos los nombres de campo y los tipos replican **exactamente** lo que
/// devuelve el backend de Jorima, verificado en el código del repositorio
/// (no se inventaron endpoints ni formatos):
///
///  * `GET  /api/animo/hoy`          -> `web/app/api/animo/hoy/route.ts`
///  * `POST /api/animo`              -> `web/app/api/animo/route.ts`
///  * `POST /api/chat`               -> `web/app/api/chat/route.ts`
///  * `GET  /api/relajacion/catalogo`-> `web/app/api/relajacion/catalogo/route.ts`
///  * `POST /api/relajacion/sesiones`-> `web/app/api/relajacion/sesiones/route.ts`
///  * `GET  /api/relajacion/conteo`  -> `web/app/api/relajacion/conteo/route.ts`
///  * `GET  /api/capsula/hoy`        -> `web/app/api/capsula/hoy/route.ts`
///  * `POST /api/login/mobile`       -> `web/app/api/login/mobile/route.ts`
library;

int _aEntero(dynamic v) {
  if (v is int) return v;
  if (v is num) return v.toInt();
  return int.tryParse(v?.toString() ?? '') ?? 0;
}

String _aTexto(dynamic v) => v?.toString() ?? '';

DateTime _aFecha(dynamic v) {
  if (v == null) return DateTime.now();
  return DateTime.tryParse(v.toString())?.toLocal() ?? DateTime.now();
}

// ─────────────────────────────────────────────────────────────
// RF-02 · Racha de cuidado
// ─────────────────────────────────────────────────────────────

/// Instantánea de la racha. Espejo de `RachaSnapshot` en `web/lib/racha.ts`.
///
/// El backend usa una "racha con raíz": si se falta un día la racha **no**
/// vuelve a cero, se retoma desde `rachaRaiz`, que solo puede subir. Por eso
/// la planta del reloj nunca "se muere"; solo crece.
class RachaSnapshot {
  const RachaSnapshot({
    required this.rachaActual,
    required this.rachaRaiz,
    required this.mejorRacha,
    required this.diasTotales,
  });

  /// Días consecutivos de cuidado (lo que se muestra en grande).
  final int rachaActual;

  /// Piso ganado para siempre: no baja nunca.
  final int rachaRaiz;

  /// Máximo histórico personal.
  final int mejorRacha;

  /// Días totales con check-in: alimenta el crecimiento permanente.
  final int diasTotales;

  static const RachaSnapshot vacia = RachaSnapshot(
    rachaActual: 0,
    rachaRaiz: 0,
    mejorRacha: 0,
    diasTotales: 0,
  );

  factory RachaSnapshot.desdeJson(dynamic json) {
    if (json is! Map) return vacia;
    return RachaSnapshot(
      rachaActual: _aEntero(json['racha_actual']),
      rachaRaiz: _aEntero(json['racha_raiz']),
      mejorRacha: _aEntero(json['mejor_racha']),
      diasTotales: _aEntero(json['dias_totales']),
    );
  }

  Map<String, dynamic> aJson() => <String, dynamic>{
    'racha_actual': rachaActual,
    'racha_raiz': rachaRaiz,
    'mejor_racha': mejorRacha,
    'dias_totales': diasTotales,
  };

  /// Estados de ánimo válidos del backend (`ESTADOS_VALIDOS` en
  /// `web/app/api/animo/route.ts`). El check-in es lo que incrementa la racha.
  static const List<String> estadosValidos = <String>[
    'muy mal',
    'mal',
    'regular',
    'bien',
    'muy bien',
  ];
}

/// Respuesta de `GET /api/animo/hoy`.
class EstadoAnimoHoy {
  const EstadoAnimoHoy({
    required this.yaContesto,
    required this.estado,
    required this.racha,
  });

  final bool yaContesto;
  final String? estado;
  final RachaSnapshot racha;

  static const EstadoAnimoHoy vacio = EstadoAnimoHoy(
    yaContesto: false,
    estado: null,
    racha: RachaSnapshot.vacia,
  );

  factory EstadoAnimoHoy.desdeJson(Map<String, dynamic> json) {
    return EstadoAnimoHoy(
      yaContesto: json['ya_contesto'] == true,
      estado: json['estado']?.toString(),
      racha: RachaSnapshot.desdeJson(json['racha']),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// RF-03 · Rutinas de cuidado
// ─────────────────────────────────────────────────────────────

/// Tipos que acepta `POST /api/relajacion/sesiones` (`TIPOS_VALIDOS`).
///
/// Se dejan como texto y no como `enum` justamente porque el valor se manda
/// tal cual al backend: un `enum` con `name` distinto provocaría un 400.
class TipoRutina {
  TipoRutina._();

  static const String respiracion = 'respiracion';
  static const String estiramiento = 'estiramiento';
  static const String juego = 'juego';
  static const String asmr = 'asmr';
  static const String capsula = 'capsula';

  /// El recordatorio de tomar agua no existe como tipo en la API.
  ///
  /// RF-03 pide "estiramientos, respiración, tomar agua", pero `TIPOS_VALIDOS`
  /// del backend no incluye agua. Se maneja como recordatorio local y **no** se
  /// registra sesión, para no mandar un valor que el servidor rechazaría.
  static const String agua = 'agua';

  static const List<String> validosEnApi = <String>[
    respiracion,
    estiramiento,
    juego,
    asmr,
    capsula,
  ];

  /// Nombre legible para la interfaz.
  static String etiqueta(String tipo) {
    switch (tipo) {
      case respiracion:
        return 'Respiración';
      case estiramiento:
        return 'Estiramiento';
      case juego:
        return 'Juego';
      case asmr:
        return 'Sensorial';
      case capsula:
        return 'Cápsula';
      case agua:
        return 'Tomar agua';
      default:
        return tipo;
    }
  }
}

/// Actividad del catálogo (`GET /api/relajacion/catalogo`).
class ActividadRelajacion {
  const ActividadRelajacion({
    required this.id,
    required this.tipo,
    required this.titulo,
    required this.descripcion,
    required this.duracionSeg,
    required this.pantalla,
  });

  final String id;
  final String tipo;
  final String titulo;
  final String descripcion;
  final int duracionSeg;

  /// Nombre de la pantalla en el cliente original (`RelajacionRespiracion`…).
  final String pantalla;

  factory ActividadRelajacion.desdeJson(Map<String, dynamic> json) {
    return ActividadRelajacion(
      id: _aTexto(json['id']),
      tipo: _aTexto(json['tipo']),
      titulo: _aTexto(json['titulo']),
      descripcion: _aTexto(json['descripcion']),
      duracionSeg: _aEntero(json['duracion_seg']),
      pantalla: _aTexto(json['pantalla']),
    );
  }

  Map<String, dynamic> aJson() => <String, dynamic>{
    'id': id,
    'tipo': tipo,
    'titulo': titulo,
    'descripcion': descripcion,
    'duracion_seg': duracionSeg,
    'pantalla': pantalla,
  };

  Duration get duracion => Duration(seconds: duracionSeg);

  /// Recordatorio de agua: mismo formato pero sin id del servidor.
  static const ActividadRelajacion agua = ActividadRelajacion(
    id: 'agua-local',
    tipo: TipoRutina.agua,
    titulo: 'Un trago de agua',
    descripcion: 'Tu cuerpo también pide pausas. Bebe un poco de agua.',
    duracionSeg: 30,
    pantalla: 'RutinaAgua',
  );
}

// ─────────────────────────────────────────────────────────────
// RF-01 · Chat con el AI Assistant
// ─────────────────────────────────────────────────────────────

/// Estado de un mensaje en el reloj.
///
/// `pendiente` es la clave del modo sin conexión: el mensaje se guarda y se
/// reintenta cuando vuelve la red.
enum EstadoMensaje { enviado, pendiente, error }

class MensajeChat {
  const MensajeChat({
    required this.id,
    required this.role,
    required this.texto,
    required this.fecha,
    this.estado = EstadoMensaje.enviado,
    this.local = false,
  });

  /// `mensaje_id` del servidor, o un id negativo para los locales.
  final int id;

  /// `user` o `assistant`.
  final String role;
  final String texto;
  final DateTime fecha;
  final EstadoMensaje estado;

  /// true cuando el mensaje todavía no existe en el servidor.
  final bool local;

  bool get esUsuario => role == 'user';

  MensajeChat copiarCon({
    int? id,
    String? role,
    String? texto,
    DateTime? fecha,
    EstadoMensaje? estado,
    bool? local,
  }) {
    return MensajeChat(
      id: id ?? this.id,
      role: role ?? this.role,
      texto: texto ?? this.texto,
      fecha: fecha ?? this.fecha,
      estado: estado ?? this.estado,
      local: local ?? this.local,
    );
  }

  factory MensajeChat.desdeJson(Map<String, dynamic> json) {
    return MensajeChat(
      id: _aEntero(json['mensaje_id'] ?? json['id']),
      role: _aTexto(json['role'] ?? json['rol'] ?? 'assistant'),
      texto: _aTexto(json['texto']),
      fecha: _aFecha(json['fecha']),
    );
  }
}

/// Respuesta de `POST /api/chat`.
class RespuestaChat {
  const RespuestaChat({
    required this.conversacionId,
    required this.respuesta,
    this.alerta = false,
    this.nivel,
    this.sentimiento,
    this.temporal = false,
  });

  final int conversacionId;
  final String respuesta;

  /// El backend marca `alerta` cuando detecta riesgo alto/crisis.
  final bool alerta;
  final String? nivel;
  final String? sentimiento;

  /// true si el backend respondió con el texto de contingencia.
  final bool temporal;

  factory RespuestaChat.desdeJson(Map<String, dynamic> json) {
    return RespuestaChat(
      conversacionId: _aEntero(json['conversacion_id']),
      respuesta: _aTexto(json['respuesta']),
      alerta: json['alerta'] == true,
      nivel: json['nivel']?.toString(),
      sentimiento: json['sentimiento']?.toString(),
      temporal: json['temporal'] == true,
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Sesión
// ─────────────────────────────────────────────────────────────

class UsuarioJorima {
  const UsuarioJorima({
    required this.id,
    required this.nombre,
    required this.correo,
    this.tipoUsuario = 2,
    this.tipoCuenta,
    this.avatarGenero,
    this.onboardingCompleto = false,
  });

  final int id;
  final String nombre;
  final String correo;
  final int tipoUsuario;
  final String? tipoCuenta;
  final String? avatarGenero;
  final bool onboardingCompleto;

  factory UsuarioJorima.desdeJson(Map<String, dynamic> json) {
    return UsuarioJorima(
      id: _aEntero(json['id'] ?? json['usuario_id']),
      nombre: _aTexto(json['nombre']),
      correo: _aTexto(json['correo']),
      tipoUsuario: _aEntero(json['tipo_usuario']),
      tipoCuenta: json['tipo_cuenta']?.toString(),
      avatarGenero: json['avatar_genero']?.toString(),
      onboardingCompleto: json['onboarding_completo'] == true,
    );
  }

  Map<String, dynamic> aJson() => <String, dynamic>{
    'id': id,
    'nombre': nombre,
    'correo': correo,
    'tipo_usuario': tipoUsuario,
    'tipo_cuenta': tipoCuenta,
    'avatar_genero': avatarGenero,
    'onboarding_completo': onboardingCompleto,
  };
}

/// Resultado de `POST /api/login/mobile`.
class SesionAutenticada {
  const SesionAutenticada({required this.token, required this.usuario});

  final String token;
  final UsuarioJorima usuario;

  factory SesionAutenticada.desdeJson(Map<String, dynamic> json) {
    return SesionAutenticada(
      token: _aTexto(json['token']),
      usuario: UsuarioJorima.desdeJson(
        json['usuario'] is Map
            ? Map<String, dynamic>.from(json['usuario'] as Map)
            : <String, dynamic>{},
      ),
    );
  }
}

/// Cápsula de contenido del día (`GET /api/capsula/hoy`).
class Capsula {
  const Capsula({
    required this.id,
    required this.titulo,
    required this.texto,
    required this.duracionSeg,
  });

  final String id;
  final String titulo;
  final String texto;
  final int duracionSeg;

  factory Capsula.desdeJson(Map<String, dynamic> json) {
    return Capsula(
      id: _aTexto(json['id']),
      titulo: _aTexto(json['titulo']),
      texto: _aTexto(json['texto']),
      duracionSeg: _aEntero(json['duracion_seg']),
    );
  }
}
