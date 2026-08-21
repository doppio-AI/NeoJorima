"use client";

import { useRouter } from "next/navigation";
import {
  FiHome,
  FiClock,
  FiBookOpen,
  FiLogOut,
  FiUser,
  FiShield,
  FiMenu,
  FiX,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";
import { useSidebar } from "@/app/components/sidebar-context";

type SidebarProps = {
  active?: "inicio" | "historial" | "recursos" | "perfil";
  /** Permite a la página sobreescribir el logout por defecto (p. ej.
   * para limpiar datos propios de esa vista antes de salir). */
  onLogout?: () => void | Promise<void>;
};

/**
 * Sidebar de usuario, compartida por /usuarios, /historial, /perfil y
 * /recursos (antes cada página tenía su propia copia de este markup).
 *
 * El comportamiento responsivo (colapsar en escritorio, drawer en
 * móvil) vive en `useSidebar()` y en las reglas de `.sidebar` de
 * globals.css, así que este componente solo se encarga de la
 * navegación en sí.
 */
export default function Sidebar({ active, onLogout }: SidebarProps) {
  const router = useRouter();
  const { collapsed, toggleCollapsed, mobileOpen, closeMobile, toggleMobile } =
    useSidebar();

  const defaultLogout = async () => {
    try {
      await fetch("/api/login", { method: "DELETE" });
      document.cookie =
        "usuario_public=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  const logout = onLogout ?? defaultLogout;

  const linkClass = (section: string) =>
    `sidebar-link ${active === section ? "active" : ""}`.trim();

  const goTo = (path: string) => {
    router.push(path);
    closeMobile();
  };

  return (
    <>
      {/* Botón hamburguesa: solo visible en móvil, abre el drawer */}
      <button
        type="button"
        className="sidebar-mobile-toggle"
        onClick={toggleMobile}
        aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={mobileOpen}
      >
        <FiMenu size={22} />
      </button>

      {/* Fondo oscuro detrás del drawer en móvil */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? "visible" : ""}`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >
        <button
          type="button"
          className="sidebar-mobile-close"
          onClick={closeMobile}
          aria-label="Cerrar menú"
        >
          <FiX size={20} />
        </button>

        <div>
          <div className="sidebar-logo">
            <img
              src="/logo.jpeg"
              alt="Jorima"
              style={{ width: "100%", maxWidth: "160px", height: "auto" }}
            />
          </div>

          <nav>
            <a
              className={linkClass("inicio")}
              onClick={() => goTo("/usuarios")}
              title="Inicio"
            >
              <FiHome size={20} />
              <span className="sidebar-link-label">Inicio</span>
            </a>

            <a
              className={linkClass("historial")}
              onClick={() => goTo("/historial")}
              title="Mi Historial"
            >
              <FiClock size={20} />
              <span className="sidebar-link-label">Mi Historial</span>
            </a>

            <a
              className={linkClass("recursos")}
              onClick={() => goTo("/recursos")}
              title="Recursos de Ayuda"
            >
              <FiBookOpen size={20} />
              <span className="sidebar-link-label">Recursos de Ayuda</span>
            </a>

            <a
              className="sidebar-link"
              onClick={() =>
                window.open("/aviso-privacidad", "_blank", "noopener,noreferrer")
              }
              title="Aviso de Privacidad"
            >
              <FiShield size={20} />
              <span className="sidebar-link-label">Aviso de Privacidad</span>
            </a>
          </nav>
        </div>

        <div>
          <a
            className={linkClass("perfil")}
            onClick={() => goTo("/perfil")}
            title="Mi Perfil"
          >
            <FiUser size={20} />
            <span className="sidebar-link-label">Mi Perfil</span>
          </a>

          <div className="logout" onClick={logout} title="Cerrar Sesión">
            <FiLogOut size={20} />
            <span className="sidebar-link-label">Cerrar Sesión</span>
          </div>

          {/* Colapsar/expandir: solo tiene efecto en escritorio */}
          <button
            type="button"
            className="sidebar-collapse-toggle"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <FiChevronsRight size={18} /> : <FiChevronsLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
}
