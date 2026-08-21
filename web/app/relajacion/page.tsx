"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiWind, FiActivity, FiCircle, FiGrid, FiArrowLeft } from "react-icons/fi";

type Actividad = {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  pantalla: string;
};

const RUTA_POR_PANTALLA: Record<string, string> = {
  RelajacionRespiracion: "/relajacion/respiracion",
  RelajacionEstiramiento: "/relajacion/estiramiento",
  RelajacionBurbujas: "/relajacion/burbujas",
  RelajacionMemorama: "/relajacion/memorama",
};

const ICONO_POR_TIPO: Record<string, React.ReactNode> = {
  respiracion: <FiWind size={22} />,
  estiramiento: <FiActivity size={22} />,
  asmr: <FiCircle size={22} />,
  juego: <FiGrid size={22} />,
};

function readCookie(name: string): string | null {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [cookieName, ...cookieValue] = cookie.trim().split("=");
    if (cookieName === name) return decodeURIComponent(cookieValue.join("="));
  }
  return null;
}

export default function RelajacionPickerPage() {
  const router = useRouter();
  const [catalogo, setCatalogo] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!readCookie("usuario_public")) {
      router.replace("/");
      return;
    }

    fetch("/api/relajacion/catalogo", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.catalogo)) setCatalogo(data.catalogo);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const irA = (actividad: Actividad) => {
    const ruta = RUTA_POR_PANTALLA[actividad.pantalla];
    if (ruta) router.push(ruta);
  };

  const sorprendeme = () => {
    if (catalogo.length === 0) return;
    irA(catalogo[Math.floor(Math.random() * catalogo.length)]);
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 32 }}>
      <button
        onClick={() => router.push("/usuarios")}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--neutral-600)", marginBottom: 16 }}
      >
        <FiArrowLeft /> Volver
      </button>

      <h1>Un momento para ti</h1>
      <p style={{ color: "var(--neutral-500)", marginBottom: 20 }}>
        Elige algo para desconectar unos minutos, o deja que Jorima elija por ti.
      </p>

      <button className="btn-primary" onClick={sorprendeme} style={{ marginBottom: 24 }}>
        Sorpréndeme
      </button>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {catalogo.map((actividad) => (
            <div
              key={actividad.id}
              onClick={() => irA(actividad)}
              style={{
                border: "1px solid var(--neutral-200)",
                borderRadius: 12,
                padding: 18,
                cursor: "pointer",
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                background: "white",
              }}
            >
              <div style={{ color: "#0F4C81" }}>{ICONO_POR_TIPO[actividad.tipo] ?? <FiCircle />}</div>
              <div>
                <strong>{actividad.titulo}</strong>
                <p style={{ margin: "4px 0 0", color: "var(--neutral-500)", fontSize: 14 }}>
                  {actividad.descripcion}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
