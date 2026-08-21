"use client"; // Asegúrate de que sea un Client Component

import Link from "next/link";
import { FiLogOut, FiMenu, FiX, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/app/components/sidebar-context";

type AdminSection = "usuarios" | "metricas" | "ayuda" | "alertas";

interface AdminSidebarProps {
  active: AdminSection;
  onLogout?: () => void; // Recibe el logout desde el parent
}

export default function AdminSidebarSimple({ active, onLogout }: AdminSidebarProps) {
  const router = useRouter();
  const { collapsed, toggleCollapsed, mobileOpen, closeMobile, toggleMobile } =
    useSidebar();

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        console.error("Error al cerrar sesión");
      }

      document.cookie =
        "usuario_public=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      localStorage.removeItem("user-data");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  const getLinkClass = (section: AdminSection) =>
    `sidebar-link ${active === section ? "active" : ""}`.trim();

  return (
    <>
      <button
        type="button"
        className="sidebar-mobile-toggle"
        onClick={toggleMobile}
        aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={mobileOpen}
      >
        <FiMenu size={22} />
      </button>

      <div
        className={`sidebar-backdrop ${mobileOpen ? "visible" : ""}`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      <aside
        className={`sidebar admin-sidebar ${collapsed ? "collapsed" : ""} ${
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

        <div className="admin-sidebar-shell">
          <div className="sidebar-logo admin-sidebar-brand">
            <div>
              <span className="admin-sidebar-eyebrow">Panel</span>
              <strong className="admin-sidebar-title">Administración</strong>
            </div>
          </div>

          <nav className="admin-sidebar-nav">
            <Link className={getLinkClass("usuarios")} href="/administrador" onClick={closeMobile}>
              Usuarios
            </Link>
            <Link className={getLinkClass("alertas")} href="/administrador/alertas" onClick={closeMobile}>
              Alertas
            </Link>
            <Link className={getLinkClass("metricas")} href="/administrador/metricas" onClick={closeMobile}>
              Métricas
            </Link>
            <Link className={getLinkClass("ambiente")} href="/administrador/ambiente" onClick={closeMobile}>
              Ambiente laboral
            </Link>
            <Link className={getLinkClass("ayuda")} href="/administrador/ayuda" onClick={closeMobile}>
              Ayuda y guías
            </Link>
          </nav>
        </div>

<<<<<<< HEAD
        <nav className="admin-sidebar-nav">
          <Link className={getLinkClass("usuarios")} href="/administrador">
            Usuarios
          </Link>
          <Link className={getLinkClass("alertas")} href="/administrador/alertas">
            Alertas
          </Link>
          <Link className={getLinkClass("metricas")} href="/administrador/metricas">
            Métricas
          </Link>
          <Link className={getLinkClass("ayuda")} href="/administrador/ayuda">
            Ayuda y guías
          </Link>
        </nav>
      </div>
=======
        <div>
          <button
            className="admin-logout-button"
            onClick={handleLogout}
          >
            <FiLogOut size={20} />
            <span className="sidebar-link-label">Cerrar Sesión</span>
          </button>
>>>>>>> 92f8d259e32feaad8ca6eb45ebd3d55ffc66b124

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

