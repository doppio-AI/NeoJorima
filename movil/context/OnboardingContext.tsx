import React, { createContext, useContext, useState } from "react";

export type TipoCuenta = "personal" | "empresa";
export type AvatarGenero = "femenino" | "masculino";

interface OnboardingData {
  avatarGenero: AvatarGenero;
  tipoCuenta: TipoCuenta | null;
  edificioId: number | null;
  horasActividadDiaria: number;
  tareasPorDia: number;
  tareasPendientesMes: number;
  personasDependientes: number;
  nombresDependientes: string[];
}

interface OnboardingContextValue extends OnboardingData {
  setAvatarGenero: (v: AvatarGenero) => void;
  setTipoCuenta: (v: TipoCuenta) => void;
  setEdificioId: (v: number | null) => void;
  setHorasActividadDiaria: (v: number) => void;
  setTareasPorDia: (v: number) => void;
  setTareasPendientesMes: (v: number) => void;
  setPersonasDependientes: (v: number) => void;
  setNombresDependientes: (v: string[]) => void;
}

const defaultData: OnboardingData = {
  avatarGenero: "femenino",
  tipoCuenta: null,
  edificioId: null,
  horasActividadDiaria: 8,
  tareasPorDia: 3,
  tareasPendientesMes: 5,
  personasDependientes: 0,
  nombresDependientes: [],
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData);

  const value: OnboardingContextValue = {
    ...data,
    setAvatarGenero: (v) => setData((d) => ({ ...d, avatarGenero: v })),
    setTipoCuenta: (v) => setData((d) => ({ ...d, tipoCuenta: v })),
    setEdificioId: (v) => setData((d) => ({ ...d, edificioId: v })),
    setHorasActividadDiaria: (v) => setData((d) => ({ ...d, horasActividadDiaria: v })),
    setTareasPorDia: (v) => setData((d) => ({ ...d, tareasPorDia: v })),
    setTareasPendientesMes: (v) => setData((d) => ({ ...d, tareasPendientesMes: v })),
    setPersonasDependientes: (v) => setData((d) => ({ ...d, personasDependientes: v })),
    setNombresDependientes: (v) => setData((d) => ({ ...d, nombresDependientes: v })),
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding debe usarse dentro de <OnboardingProvider>");
  }
  return ctx;
}
