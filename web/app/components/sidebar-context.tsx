"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";

/**
 * Estado centralizado de la sidebar.
 *
 * - `collapsed`: modo compacto en escritorio (icon-only). Se persiste
 *   en localStorage para recordar la preferencia del usuario.
 * - `mobileOpen`: controla el drawer/overlay en pantallas pequeñas.
 *   Nunca afecta el layout de escritorio y se cierra automáticamente
 *   al navegar entre páginas.
 *
 * Vivir en un solo Provider (montado en el layout raíz) es lo que
 * permite que el comportamiento de la sidebar esté centralizado en
 * un solo lugar en vez de reimplementarse en cada página.
 */

type SidebarContextValue = {
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
};

const STORAGE_COLLAPSED = "jorima_sidebar_collapsed";

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Recupera la preferencia guardada solo del lado del cliente
  // para evitar problemas de hidratación.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_COLLAPSED) === "1");
    } catch {
      // localStorage no disponible (SSR, modo privado, etc.)
    }
  }, []);

  // Cierra el drawer móvil automáticamente al cambiar de ruta,
  // así nunca queda "atascado" tapando la nueva vista.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Bloquea el scroll del body mientras el drawer móvil está abierto.
  useEffect(() => {
    if (mobileOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [mobileOpen]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_COLLAPSED, next ? "1" : "0");
      } catch {
        // ignorar si no hay storage disponible
      }
      return next;
    });
  }, []);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({
      collapsed,
      toggleCollapsed,
      mobileOpen,
      openMobile,
      closeMobile,
      toggleMobile,
    }),
    [collapsed, toggleCollapsed, mobileOpen, openMobile, closeMobile, toggleMobile]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar debe usarse dentro de <SidebarProvider>");
  }
  return ctx;
}
