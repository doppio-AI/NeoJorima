"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiX, FiFeather } from "react-icons/fi";
import MensajeMotivadorFinalWeb from "@/app/components/MensajeMotivadorFinalWeb";

type Capsula = {
  id: string;
  titulo: string;
  texto: string;
  duracion_seg: number;
};

/* ─────────────────────────────────────────────────
   Cápsula de 90 segundos.

   A propósito NO hay botón de "siguiente" ni lista para
   explorar: se muestra una sola cápsula, elegida para la
   persona, y el único camino hacia adelante es cerrarla.
   Ver la lógica de selección en lib/capsulas.ts.
   ───────────────────────────────────────────────── */
export default function CapsulaPage() {
  const router = useRouter();
  const [capsula, setCapsula] = useState<Capsula | null>(null);
  const [cargando, setCargando] = useState(true);
  const [terminado, setTerminado] = useState(false);
  const inicio = useRef(Date.now());

  useEffect(() => {
    fetch("/api/capsula/hoy", { credentials: "same-origin", cache: "no-store" })
      .then((res) => {
        if (res.status === 401) {
          router.replace("/");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.capsula) setCapsula(data.capsula);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [router]);

  if (terminado) {
    const duracionSeg = (Date.now() - inicio.current) / 1000;
    return <MensajeMotivadorFinalWeb tipo="capsula" duracionSeg={duracionSeg} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 24,
        position: "relative",
      }}
    >
      <button
        onClick={() => router.push("/usuarios")}
        style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", cursor: "pointer", color: "var(--neutral-500)" }}
      >
        <FiX size={24} />
      </button>

      {cargando ? (
        <p style={{ color: "var(--neutral-500)" }}>Un momento...</p>
      ) : capsula ? (
        <div style={{ maxWidth: 480, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <FiFeather size={28} color="#197A6C" />
          <h1 style={{ color: "#12201F", fontSize: 24 }}>{capsula.titulo}</h1>
          <p style={{ color: "var(--neutral-600)", fontSize: 16, lineHeight: 1.7 }}>{capsula.texto}</p>

          <button
            className="btn-primary"
            onClick={() => setTerminado(true)}
            style={{ marginTop: 16 }}
          >
            Listo por hoy
          </button>
        </div>
      ) : (
        <p style={{ color: "var(--neutral-500)" }}>No se pudo cargar tu cápsula de hoy.</p>
      )}
    </div>
  );
}
