"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiX } from "react-icons/fi";
import MensajeMotivadorFinalWeb from "@/app/components/MensajeMotivadorFinalWeb";

const SIMBOLOS = ["🌊", "🌿", "☀️", "🌙", "🍃", "🌸"];

type Carta = { id: number; simbolo: string; volteada: boolean; encontrada: boolean };

function crearMazo(): Carta[] {
  return [...SIMBOLOS, ...SIMBOLOS]
    .map((simbolo) => ({ simbolo, orden: Math.random() }))
    .sort((a, b) => a.orden - b.orden)
    .map((item, i) => ({ id: i, simbolo: item.simbolo, volteada: false, encontrada: false }));
}

export default function MemoramaPage() {
  const router = useRouter();
  const [cartas, setCartas] = useState<Carta[]>(() => crearMazo());
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [bloqueado, setBloqueado] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const inicio = useRef(Date.now());

  const encontradas = cartas.filter((c) => c.encontrada).length;

  useEffect(() => {
    if (encontradas === cartas.length) setTerminado(true);
  }, [encontradas, cartas.length]);

  const voltear = (id: number) => {
    if (bloqueado) return;
    const carta = cartas.find((c) => c.id === id);
    if (!carta || carta.volteada || carta.encontrada) return;

    const nuevaSeleccion = [...seleccion, id];
    setCartas((prev) => prev.map((c) => (c.id === id ? { ...c, volteada: true } : c)));
    setSeleccion(nuevaSeleccion);

    if (nuevaSeleccion.length === 2) {
      setBloqueado(true);
      const [aId, bId] = nuevaSeleccion;
      const a = cartas.find((c) => c.id === aId)!;
      const b = cartas.find((c) => c.id === bId)!;

      setTimeout(() => {
        setCartas((prev) =>
          prev.map((c) => {
            if (c.id === aId || c.id === bId) {
              if (a.simbolo === b.simbolo) return { ...c, encontrada: true, volteada: true };
              return { ...c, volteada: false };
            }
            return c;
          })
        );
        setSeleccion([]);
        setBloqueado(false);
      }, 700);
    }
  };

  if (terminado) {
    const duracionSeg = (Date.now() - inicio.current) / 1000;
    return <MensajeMotivadorFinalWeb tipo="juego" duracionSeg={duracionSeg} />;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: 32, position: "relative" }}>
      <button
        onClick={() => router.push("/usuarios")}
        style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", cursor: "pointer", color: "var(--neutral-500)" }}
      >
        <FiX size={24} />
      </button>

      <h1 style={{ color: "#0F4C81", marginTop: 24 }}>Memorama rápido</h1>
      <p style={{ color: "var(--neutral-500)", marginBottom: 24 }}>{encontradas / 2}/{SIMBOLOS.length} pares</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 70px)", gap: 10 }}>
        {cartas.map((carta) => (
          <button
            key={carta.id}
            onClick={() => voltear(carta.id)}
            style={{
              width: 70,
              height: 70,
              borderRadius: 10,
              border: carta.volteada || carta.encontrada ? "1px solid var(--neutral-200)" : "none",
              background: carta.volteada || carta.encontrada ? "white" : "#0F4C81",
              fontSize: 28,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {carta.volteada || carta.encontrada ? carta.simbolo : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
