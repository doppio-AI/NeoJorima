"use client";

import Link from "next/link";
import { FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";

type SuperadminSection = "instituciones" | "admins" | "metricas";

interface Props {
  active: SuperadminSection;
}

export default function SuperadminSidebar({ active }: Props) {
  const router = useRouter();

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
    <aside className="sidebar admin-sidebar">
      <div className="admin-sidebar-shell">
        <div className="sidebar-logo admin-sidebar-brand">
          <div>
            <span className="admin-sidebar-eyebrow">Panel</span>
            <strong className="admin-sidebar-title">Superadmin</strong>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <Link className={getLinkClass("instituciones")} href="/superadmin/instituciones">
            Instituciones
          </Link>
          <Link className={getLinkClass("admins")} href="/superadmin/admins">
            Admins
          </Link>
          <Link className={getLinkClass("metricas")} href="/superadmin/metricas">
            Métricas
          </Link>
        </nav>
      </div>

      <button className="admin-logout-button" onClick={handleLogout}>
        <FiLogOut size={20} />
        <span>Cerrar Sesión</span>
      </button>
    </aside>
  );
}
