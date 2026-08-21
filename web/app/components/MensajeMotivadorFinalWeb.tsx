"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import JorimaAvatarWeb from "./JorimaAvatarWeb";

const MENSAJES_GENERICOS = [
  "Tómate este momento como tuyo. Lo hiciste bien.",
  "Cada pausa cuenta. Gracias por cuidarte hoy.",
  "Un respiro a la vez. Vas por buen camino.",
  "Cuidarte a ti también es productivo.",
];

interface Props {
  tipo: "respiracion" | "estiramiento" | "juego" | "asmr";
  duracionSeg: number;
}

export default function MensajeMotivadorFinalWeb({ tipo, duracionSeg }: Props) {
  const router = useRouter();
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    const finalizar = async () => {
      try {
        const [resPerfil] = await Promise.all([
          fetch("/api/perfil", { credentials: "same-origin" }),
          fetch("/api/relajacion/sesiones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              tipo,
              duracion_seg: Math.max(1, Math.round(duracionSeg)),
              completada: true,
            }),
          }),
        ]);

        const dataPerfil = await resPerfil.json().catch(() => ({}));
        const nombres: string[] = Array.isArray(dataPerfil?.perfil_bienestar?.nombres_dependientes)
          ? dataPerfil.perfil_bienestar.nombres_dependientes
          : [];

        if (!activo) return;

        if (nombres.length > 0) {
          const persona = nombres[Math.floor(Math.random() * nombres.length)];
          setMensaje(`Te tomaste este momento para ti. Eso también es cuidar de ${persona}.`);
        } else {
          setMensaje(MENSAJES_GENERICOS[Math.floor(Math.random() * MENSAJES_GENERICOS.length)]);
        }
      } catch (e) {
        if (activo) setMensaje(MENSAJES_GENERICOS[0]);
      } finally {
        if (activo) setCargando(false);
      }
    };

    void finalizar();

    return () => {
      activo = false;
    };
  }, [tipo, duracionSeg]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: 24,
        textAlign: "center",
      }}
    >
      <JorimaAvatarWeb mood="sonrisa_amplia" size={150} />

      {cargando ? (
        <p style={{ color: "var(--neutral-500)" }}>Un momento...</p>
      ) : (
        <h2 style={{ maxWidth: 420 }}>{mensaje}</h2>
      )}

      <button
        className="btn-primary"
        onClick={() => router.push("/usuarios")}
        style={{ marginTop: 8 }}
      >
        Volver a inicio
      </button>
    </div>
  );
}
