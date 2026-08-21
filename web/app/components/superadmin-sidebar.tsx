"use client";

import Link from "next/link";
import { FiLogOut, FiMenu, FiX, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/app/components/sidebar-context";

type SuperadminSection = "instituciones" | "admins" | "metricas";

interface Props {
  active: SuperadminSection;
}

export default function SuperadminSidebar({ active }: Props) {
  const router = useRouter();
  const { collapsed, toggleCollapsed, mobileOpen, closeMobile, toggleMobile } =
    useSidebar();

  const handleLogout = async () => {
    try {
      await fetch("/api/login", { method: "DELETE", credentials: "same-origin" });
    } finally {
      document.cookie = "usuario_public=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/");
      router.refresh();
    }
  };

  const getLinkClass = (section: SuperadminSection) =>
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
              <strong className="admin-sidebar-title">Superadmin</strong>
            </div>
          </div>

          <nav className="admin-sidebar-nav">
            <Link className={getLinkClass("instituciones")} href="/superadmin/instituciones" onClick={closeMobile}>
              Instituciones
            </Link>
            <Link className={getLinkClass("admins")} href="/superadmin/admins" onClick={closeMobile}>
              Admins
            </Link>
            <Link className={getLinkClass("metricas")} href="/superadmin/metricas" onClick={closeMobile}>
              Métricas
            </Link>
          </nav>
        </div>

        <div>
          <button className="admin-logout-button" onClick={handleLogout}>
            <FiLogOut size={20} />
            <span className="sidebar-link-label">Cerrar Sesión</span>
          </button>

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
