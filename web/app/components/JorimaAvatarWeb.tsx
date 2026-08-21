"use client";

import { useEffect, useState } from "react";

export type JorimaMood = "sereno1" | "sereno2" | "sonrisa_amplia" | "preocupacion" | "tristeza";

interface Props {
  mood: JorimaMood;
  talking?: boolean;
  size?: number;
}

export default function JorimaAvatarWeb({ mood, talking = false, size = 140 }: Props) {
  const [frame, setFrame] = useState<JorimaMood>(mood);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (!talking) {
      setFrame(mood);
      return;
    }

    const interval = setInterval(() => {
      setFrame((prev) => (prev === "sereno1" ? "sereno2" : "sereno1"));
    }, 450);

    return () => clearInterval(interval);
  }, [talking, mood]);

  // "Pop" cada vez que cambia el frame visible, igual que en móvil.
  useEffect(() => {
    setPop(true);
    const timeout = setTimeout(() => setPop(false), 220);
    return () => clearTimeout(timeout);
  }, [frame]);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        border: "3px solid #0F4C81",
        background: "white",
        flexShrink: 0,
        transform: pop ? "scale(1.12)" : "scale(1)",
        transition: pop
          ? "transform 150ms ease-out"
          : "transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <img
        src={`/jorima/${frame}.png`}
        alt="Jorima"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}
