import { prisma } from "@/lib/prisma";
import { TAXONOMIA_CATEGORIAS, type CategoriaRiesgo } from "@/lib/ia/prompt";

/* ═══════════════════════════════════════════════════════════
   Cápsula de 90 segundos (idea #2 de "Enganche Sano")

   Un solo contenido corto, elegido por la categoría que la IA
   detectó la última vez en el chat de la persona — no un feed,
   no una lista para explorar. Se muestra una cápsula, se cierra,
   y no hay "una más": la restricción es la función.

   Se elige de forma determinística por día (usuario_id + día del
   año), así que la misma persona ve la misma cápsula todo el día
   si vuelve a entrar, pero cambia mañana.
   ═══════════════════════════════════════════════════════════ */

export type Capsula = {
  id: string;
  categoria: CategoriaRiesgo;
  titulo: string;
  texto: string;
  duracion_seg: number;
};

const CAPSULAS: Capsula[] = [
  {
    id: "carga_trabajo-1",
    categoria: "carga_trabajo",
    titulo: "Una tarea a la vez",
    texto: "Mira tu lista de pendientes y elige solo uno. No el más urgente, no el más grande: el primero que puedas empezar ahora mismo. El resto de la lista va a seguir ahí en cinco minutos, exactamente igual. No necesitas cargar con todo al mismo tiempo para que se haga.",
    duracion_seg: 90,
  },
  {
    id: "carga_trabajo-2",
    categoria: "carga_trabajo",
    titulo: "Lo que no se puede terminar hoy",
    texto: "Hay días en que la lista gana. Eso no dice nada de qué tan capaz eres, dice que había más de lo que cabe en un día. Antes de cerrar por hoy, elige una sola cosa que sí puedas dejar resuelta, y date permiso de mover el resto a mañana sin culpa.",
    duracion_seg: 90,
  },
  {
    id: "relaciones_laborales-1",
    categoria: "relaciones_laborales",
    titulo: "Antes de responder",
    texto: "Si algo que te dijeron hoy todavía te sigue dando vueltas, respira antes de contestar. No tienes que resolverlo en el mismo momento en que lo sentiste. Un mensaje, una junta o un comentario incómodo pueden esperar una hora, o hasta mañana, para que respondas desde donde estás bien, no desde donde te tomaron de sorpresa.",
    duracion_seg: 90,
  },
  {
    id: "relaciones_laborales-2",
    categoria: "relaciones_laborales",
    titulo: "No todo malentendido es sobre ti",
    texto: "Un tono seco en un mensaje, una respuesta cortante, un silencio que se siente raro: la mayoría de las veces tiene que ver con el día que esa persona está teniendo, no contigo. No necesitas resolverlo ahora ni adivinar qué hiciste mal. A veces basta con notarlo y seguir.",
    duracion_seg: 90,
  },
  {
    id: "conciliacion_vida_trabajo-1",
    categoria: "conciliacion_vida_trabajo",
    titulo: "El trabajo se queda en el trabajo",
    texto: "Cuando termine tu jornada de hoy, prueba un gesto pequeño y físico para cerrarla: cerrar la laptop, guardar la libreta, cambiarte de ropa. No es simbólico nada más — le da a tu cabeza una señal clara de que ese capítulo del día terminó, y que lo que sigue ya es tuyo.",
    duracion_seg: 90,
  },
  {
    id: "conciliacion_vida_trabajo-2",
    categoria: "conciliacion_vida_trabajo",
    titulo: "Cinco minutos que son solo tuyos",
    texto: "En algún punto de hoy, aparta cinco minutos que no sean para nadie más: ni para una tarea, ni para revisar el teléfono, ni para adelantar algo pendiente. Solo estar. No tienen que producir nada. Ese es exactamente el punto.",
    duracion_seg: 90,
  },
  {
    id: "reconocimiento_desarrollo-1",
    categoria: "reconocimiento_desarrollo",
    titulo: "Lo que sí lograste hoy",
    texto: "Antes de pensar en todo lo que falta, nombra una sola cosa que sí hiciste hoy, por pequeña que parezca. Responder ese mensaje difícil, terminar algo a tiempo, simplemente presentarte a pesar de no tener ganas. Cuenta. El progreso casi nunca se ve tan grande como se siente terminarlo.",
    duracion_seg: 90,
  },
  {
    id: "reconocimiento_desarrollo-2",
    categoria: "reconocimiento_desarrollo",
    titulo: "Aprender no es lo mismo que fallar",
    texto: "Si algo no salió como esperabas hoy, date un segundo antes de llamarlo fracaso. La mayoría de las veces es información: ahora sabes algo que antes no sabías. Eso también es avanzar, aunque no se sienta como una victoria.",
    duracion_seg: 90,
  },
  {
    id: "salud_emocional-1",
    categoria: "salud_emocional",
    titulo: "Nombrar lo que sientes",
    texto: "Detente un momento y ponle una palabra a como te sientes ahora mismo, sin corregirla ni justificarla. Cansado, ansioso, irritado, tranquilo — lo que sea que sea real. Nombrarlo no lo resuelve, pero sí le baja el volumen. No necesitas hacer nada más con eso todavía.",
    duracion_seg: 90,
  },
  {
    id: "salud_emocional-2",
    categoria: "salud_emocional",
    titulo: "No tienes que estar bien todo el tiempo",
    texto: "Puedes tener un mal día y seguir siendo bueno en lo que haces. Puedes estar cansado y seguir mereciendo lo mismo respeto y paciencia que cualquier otro día. No hay una versión de ti que tenga que rendir perfecto para valer lo que vale.",
    duracion_seg: 90,
  },
  {
    id: "seguridad_fisica-1",
    categoria: "seguridad_fisica",
    titulo: "Vuelve a tu cuerpo",
    texto: "Nota, sin cambiar nada todavía, cómo está tu cuerpo ahora mismo: la espalda, el cuello, las manos. A veces cargamos tensión física horas antes de notar que está ahí. Solo con darte cuenta ya empieza a bajar un poco.",
    duracion_seg: 90,
  },
  {
    id: "seguridad_fisica-2",
    categoria: "seguridad_fisica",
    titulo: "Un chequeo rápido de postura",
    texto: "Endereza la espalda, baja los hombros lejos de las orejas, y apoya los dos pies en el piso. Sostén esa postura unos segundos. Es un ajuste pequeño, pero tu cuerpo lo nota — y tú, un rato después, también.",
    duracion_seg: 90,
  },
  {
    id: "otro-1",
    categoria: "otro",
    titulo: "Un respiro antes de seguir",
    texto: "Detente un momento. Inhala contando hasta cuatro, sostén un segundo, y exhala más lento de lo que inhalaste. No necesitas resolver nada mientras lo haces — solo dale a tu cuerpo unos segundos sin exigirle nada.",
    duracion_seg: 90,
  },
  {
    id: "otro-2",
    categoria: "otro",
    titulo: "Lo pequeño también cuenta",
    texto: "No todos los días necesitan ser productivos para valer la pena. A veces el logro del día es simplemente haber llegado hasta aquí. Eso ya es suficiente por ahora.",
    duracion_seg: 90,
  },
];

function diaDelAnio(fecha: Date): number {
  const inicio = new Date(fecha.getFullYear(), 0, 0);
  const diff = fecha.getTime() - inicio.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Determina la categoría de la persona a partir del último mensaje
 * suyo que la IA clasificó en el chat. Si todavía no ha chateado
 * con Jorima, cae en "otro".
 */
async function obtenerUltimaCategoria(usuario_id: number): Promise<CategoriaRiesgo> {
  const ultimoMensaje = await prisma.mensaje.findFirst({
    where: {
      role: "user",
      categoria: { not: null },
      conversacion: { usuario_id },
    },
    orderBy: { fecha: "desc" },
    select: { categoria: true },
  });

  const categoria = ultimoMensaje?.categoria;

  if (categoria && (TAXONOMIA_CATEGORIAS as readonly string[]).includes(categoria)) {
    return categoria as CategoriaRiesgo;
  }

  return "otro";
}

export async function obtenerCapsulaDeHoy(usuario_id: number): Promise<Capsula> {
  const categoria = await obtenerUltimaCategoria(usuario_id);

  const disponibles = CAPSULAS.filter((c) => c.categoria === categoria);
  const lista = disponibles.length > 0 ? disponibles : CAPSULAS.filter((c) => c.categoria === "otro");

  const indice = (diaDelAnio(new Date()) + usuario_id) % lista.length;

  return lista[indice];
}
