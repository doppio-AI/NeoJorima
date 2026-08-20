import { NextResponse } from "next/server";

/* ───────────────────────────────────────────
   GET /api/relajacion/catalogo

   Catálogo estático por ahora (versión conceptual
   para Innovafest). No requiere sesión: es contenido
   público, igual para cualquier usuario.
   ─────────────────────────────────────────── */

const CATALOGO = [
  {
    id: "respiracion-478",
    tipo: "respiracion",
    titulo: "Respiración 4-7-8",
    descripcion: "Jorima te guía a inhalar, sostener y exhalar en un ritmo calmante.",
    duracion_seg: 90,
    pantalla: "RelajacionRespiracion",
  },
  {
    id: "estiramiento-escritorio",
    tipo: "estiramiento",
    titulo: "Pausa activa de escritorio",
    descripcion: "Una rutina corta de estiramientos que puedes hacer sin levantarte de tu lugar.",
    duracion_seg: 120,
    pantalla: "RelajacionEstiramiento",
  },
  {
    id: "burbujas-asmr",
    tipo: "asmr",
    titulo: "Burbujas para reventar",
    descripcion: "Una actividad sensorial simple, tipo pop-it digital, para soltar tensión.",
    duracion_seg: 60,
    pantalla: "RelajacionBurbujas",
  },
  {
    id: "juego-memoria",
    tipo: "juego",
    titulo: "Memorama rápido",
    descripcion: "Un juego corto de memoria para distraer la mente unos minutos.",
    duracion_seg: 90,
    pantalla: "RelajacionMemorama",
  },
] as const;

export async function GET() {
  return NextResponse.json({ catalogo: CATALOGO });
}
