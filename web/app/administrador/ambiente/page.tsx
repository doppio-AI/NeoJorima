"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AmbienteRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/administrador/metricas");
  }, [router]);

  return null;
}
