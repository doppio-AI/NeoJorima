"use client";

import JorimaAvatarWeb from "./JorimaAvatarWeb";

interface Props {
  visible: boolean;
  onClose: () => void;
  tipoCuenta: "personal" | "empresa";
  nivel: "alto" | "crisis";
}

const LINEA_DE_LA_VIDA = "8009112000";
const LINEA_DE_LA_VIDA_DISPLAY = "800 911 2000";

export default function AlertaRiesgoModalWeb({ visible, onClose, tipoCuenta, nivel }: Props) {
  if (!visible) return null;

  const esCrisis = nivel === "crisis";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: 28,
          maxWidth: 420,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          textAlign: "center",
        }}
      >
        <JorimaAvatarWeb mood="preocupacion" size={90} />

        <h3 style={{ margin: 0 }}>Notamos algo en lo que dijiste</h3>

        {tipoCuenta === "empresa" ? (
          <p style={{ margin: 0, color: "#4B5563", fontSize: 14 }}>
            Por lo que compartiste, se notificó a un administrador de tu institución para
            que pueda ofrecerte apoyo. Mientras tanto, aquí tienes ayuda inmediata si la
            necesitas:
          </p>
        ) : (
          <p style={{ margin: 0, color: "#4B5563", fontSize: 14 }}>
            Por lo que compartiste, podrías estar pasando por un momento muy difícil. No
            estás solo/a — hablar con alguien capacitado puede ayudar mucho ahora mismo.
          </p>
        )}

        {esCrisis && (
          <div style={{ background: "#FDECEC", borderRadius: 10, padding: 10, width: "100%" }}>
            <p style={{ margin: 0, color: "#DC2626", fontSize: 13, fontWeight: 600 }}>
              Si estás en peligro inmediato, llama al 911.
            </p>
          </div>
        )}

        <div>
          <p style={{ margin: "0 0 2px", fontSize: 12, color: "#6B7280" }}>
            Línea de la Vida — gratuita, 24/7
          </p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0F4C81" }}>
            {LINEA_DE_LA_VIDA_DISPLAY}
          </p>
        </div>

        <a
          href={`tel:${LINEA_DE_LA_VIDA}`}
          style={{
            display: "block",
            width: "100%",
            background: "#0F4C81",
            color: "white",
            textDecoration: "none",
            borderRadius: 10,
            padding: "12px",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Llamar a Línea de la Vida
        </a>

        {esCrisis && (
          <a href="tel:911" style={{ color: "#DC2626", fontSize: 13, fontWeight: 600 }}>
            Llamar al 911
          </a>
        )}

        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#6B7280",
            fontSize: 13,
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          Entendido, seguir platicando
        </button>
      </div>
    </div>
  );
}
