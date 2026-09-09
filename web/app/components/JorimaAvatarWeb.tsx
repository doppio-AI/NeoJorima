"use client";

import { useEffect, useState } from "react";
import { usePopAnimation } from "@/app/hooks/usePopAnimation";

export type JorimaMood = "sereno1" | "sereno2" | "sonrisa_amplia" | "preocupacion" | "tristeza";

interface Props {
  mood: JorimaMood;
  talking?: boolean;
  size?: number;
}

export default function JorimaAvatarWeb({ mood, talking = false, size = 140 }: Props) {
  const [frame, setFrame] = useState<JorimaMood>(mood);
  const { style: estiloPop, dispara } = usePopAnimation();

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
    dispara();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        ...estiloPop,
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
