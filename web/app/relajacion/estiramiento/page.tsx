"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiX } from "react-icons/fi";
import MensajeMotivadorFinalWeb from "@/app/components/MensajeMotivadorFinalWeb";

const PASOS = [
  { titulo: "Estira el cuello", descripcion: "Inclina la cabeza suavemente hacia un hombro, sostén, y cambia de lado.", segundos: 20 },
  { titulo: "Rueda los hombros", descripcion: "Haz círculos lentos con los hombros hacia atrás, respirando con calma.", segundos: 20 },
  { titulo: "Estira los brazos", descripcion: "Entrelaza los dedos, estira los brazos frente a ti y arquea la espalda un poco.", segundos: 20 },
  { titulo: "Gira el torso", descripcion: "Sentado, gira suavemente el torso hacia un lado y luego hacia el otro.", segundos: 20 },
];

export default function EstiramientoPage() {
  const router = useRouter();
  const [pasoIndex, setPasoIndex] = useState(0);
  const [segundosRestantes, setSegundosRestantes] = useState(PASOS[0].segundos);
  const [terminado, setTerminado] = useState(false);
  const inicio = useRef(Date.now());

  const avanzar = () => {
    setPasoIndex((prev) => {
      if (prev + 1 >= PASOS.length) {
        setTerminado(true);
        return prev;
      }
      return prev + 1;
    });
  };

  useEffect(() => {
    if (terminado) return;
    setSegundosRestantes(PASOS[pasoIndex].segundos);

    const interval = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          avanzar();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasoIndex, terminado]);

  if (terminado) {
    const duracionSeg = (Date.now() - inicio.current) / 1000;
    return <MensajeMotivadorFinalWeb tipo="estiramiento" duracionSeg={duracionSeg} />;
  }

  const paso = PASOS[pasoIndex];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, position: "relative", padding: 24 }}>
      <button
        onClick={() => router.push("/usuarios")}
        style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", cursor: "pointer", color: "var(--neutral-500)" }}
      >
        <FiX size={24} />
      </button>

      <p style={{ color: "var(--neutral-500)" }}>Paso {pasoIndex + 1} de {PASOS.length}</p>

      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          border: "3px solid #0F4C81",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 28, fontWeight: 700, color: "#0F4C81" }}>{segundosRestantes}</span>
      </div>

      <h2 style={{ textAlign: "center" }}>{paso.titulo}</h2>
      <p style={{ color: "var(--neutral-500)", textAlign: "center", maxWidth: 340 }}>{paso.descripcion}</p>

      <button className="btn-primary" onClick={avanzar}>Siguiente</button>
    </div>
  );
}
