"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiX } from "react-icons/fi";
import MensajeMotivadorFinalWeb from "@/app/components/MensajeMotivadorFinalWeb";

const TOTAL_BURBUJAS = 24;

export default function BurbujasPage() {
  const router = useRouter();
  const [popped, setPopped] = useState<boolean[]>(() => Array(TOTAL_BURBUJAS).fill(false));
  const [terminado, setTerminado] = useState(false);
  const inicio = useRef(Date.now());

  const popCount = popped.filter(Boolean).length;

  const pop = (i: number) => {
    if (popped[i]) return;
    setPopped((prev) => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
  };

  if (terminado || popCount === TOTAL_BURBUJAS) {
    const duracionSeg = (Date.now() - inicio.current) / 1000;
    return <MensajeMotivadorFinalWeb tipo="asmr" duracionSeg={duracionSeg} />;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: 32, position: "relative" }}>
      <button
        onClick={() => router.push("/usuarios")}
        style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", cursor: "pointer", color: "var(--neutral-500)" }}
      >
        <FiX size={24} />
      </button>

      <h1 style={{ color: "#0F4C81", marginTop: 24 }}>Revienta las burbujas</h1>
      <p style={{ color: "var(--neutral-500)", marginBottom: 24 }}>{popCount}/{TOTAL_BURBUJAS}</p>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, maxWidth: 500, marginBottom: 32 }}>
        {popped.map((estaPopped, i) => (
          <button
            key={i}
            onClick={() => pop(i)}
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              border: "none",
              cursor: estaPopped ? "default" : "pointer",
              background: estaPopped ? "#E5E7EB" : "#0F4C81",
              transition: "transform 0.15s ease, background 0.15s ease",
              transform: estaPopped ? "scale(0.85)" : "scale(1)",
            }}
          />
        ))}
      </div>

      <button className="btn-primary" onClick={() => setTerminado(true)}>Terminar</button>
    </div>
  );
}
