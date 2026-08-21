"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiX } from "react-icons/fi";
import MensajeMotivadorFinalWeb from "@/app/components/MensajeMotivadorFinalWeb";

const CICLOS = 4;
const FASES = [
  { nombre: "Inhala", duracionMs: 4000, escala: 1.4 },
  { nombre: "Sostén", duracionMs: 7000, escala: 1.4 },
  { nombre: "Exhala", duracionMs: 8000, escala: 0.7 },
] as const;

export default function RespiracionPage() {
  const router = useRouter();
  const [faseIndex, setFaseIndex] = useState(0);
  const [ciclo, setCiclo] = useState(1);
  const [escala, setEscala] = useState(0.7);
  const [terminado, setTerminado] = useState(false);
  const detenido = useRef(false);
  const inicio = useRef(Date.now());

  useEffect(() => {
    const correr = async () => {
      for (let c = 1; c <= CICLOS; c++) {
        if (detenido.current) return;
        setCiclo(c);

        for (let f = 0; f < FASES.length; f++) {
          if (detenido.current) return;
          setFaseIndex(f);
          setEscala(FASES[f].escala);

          await new Promise((resolve) => setTimeout(resolve, FASES[f].duracionMs));
        }
      }

      if (!detenido.current) setTerminado(true);
    };

    void correr();

    return () => {
      detenido.current = true;
    };
  }, []);

  if (terminado) {
    const duracionSeg = (Date.now() - inicio.current) / 1000;
    return <MensajeMotivadorFinalWeb tipo="respiracion" duracionSeg={duracionSeg} />;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, position: "relative" }}>
      <button
        onClick={() => router.push("/usuarios")}
        style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", cursor: "pointer", color: "var(--neutral-500)" }}
      >
        <FiX size={24} />
      </button>

      <p style={{ color: "var(--neutral-500)" }}>Ciclo {ciclo} de {CICLOS}</p>

      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: "#0F4C81",
          opacity: 0.85,
          transform: `scale(${escala})`,
          transition: `transform ${FASES[faseIndex].duracionMs}ms ease-in-out`,
        }}
      />

      <h1 style={{ color: "#0F4C81" }}>{FASES[faseIndex].nombre}</h1>
      <p style={{ color: "var(--neutral-500)", textAlign: "center", maxWidth: 300 }}>
        Sigue el ritmo del círculo. No hay prisa.
      </p>
    </div>
  );
}
