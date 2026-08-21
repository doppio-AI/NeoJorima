"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiSmile, FiEye, FiEyeOff } from "react-icons/fi";

export default function Registro() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    correo: "",
    contrasena: "",
    confirmContrasena: "",
  });

  const updateField = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.nombre.trim()) newErrors.nombre = "El nombre es requerido";
    if (!form.apellido_paterno.trim()) newErrors.apellido_paterno = "El apellido paterno es requerido";

    if (!form.correo.trim()) {
      newErrors.correo = "El correo es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) {
      newErrors.correo = "Escribe un correo válido";
    }

    if (!form.contrasena) {
      newErrors.contrasena = "La contraseña es requerida";
    } else if (form.contrasena.length < 8) {
      newErrors.contrasena = "La contraseña debe tener al menos 8 caracteres";
    }

    if (!form.confirmContrasena) {
      newErrors.confirmContrasena = "Confirma tu contraseña";
    } else if (form.contrasena !== form.confirmContrasena) {
      newErrors.confirmContrasena = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!aceptaPrivacidad) {
      alert("Debes aceptar el Aviso de Privacidad para continuar.");
      return;
    }

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellido_paterno: form.apellido_paterno.trim(),
          apellido_materno: form.apellido_materno.trim() || undefined,
          correo: form.correo.toLowerCase().trim(),
          contrasena: form.contrasena,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.includes("correo")) {
          setErrors({ correo: data.error });
        } else {
          alert(data.error || "Error al registrar");
        }
        return;
      }

      // /api/auth/register ya dejó la sesión iniciada (mismas cookies
      // que /api/login), así que entramos directo, sin pasar por login.
      router.replace("/usuarios");
      router.refresh();
    } catch (error) {
      alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="registro-page">
      <div className="registro-brand">
        <div className="registro-logo">
          <FiSmile size={32} color="#2A9D8F" />
          <span>Jorima</span>
        </div>
        <p>Tu espacio para manejar el estrés</p>
      </div>

      <form onSubmit={handleSubmit} className="registro-card">
        <h2>Crear cuenta</h2>

        <div className="registro-group">
          <label>Nombre(s)</label>
          <input
            type="text"
            placeholder="Juan"
            value={form.nombre}
            onChange={(e) => updateField("nombre", e.target.value)}
            className={errors.nombre ? "input-error" : ""}
          />
          {errors.nombre && <span className="error-text">{errors.nombre}</span>}
        </div>

        <div className="registro-group">
          <label>Apellido Paterno</label>
          <input
            type="text"
            placeholder="Pérez"
            value={form.apellido_paterno}
            onChange={(e) => updateField("apellido_paterno", e.target.value)}
            className={errors.apellido_paterno ? "input-error" : ""}
          />
          {errors.apellido_paterno && <span className="error-text">{errors.apellido_paterno}</span>}
        </div>

        <div className="registro-group">
          <label>Apellido Materno <span className="optional">(Opcional)</span></label>
          <input
            type="text"
            placeholder="García"
            value={form.apellido_materno}
            onChange={(e) => updateField("apellido_materno", e.target.value)}
          />
        </div>

        <div className="registro-group">
          <label>Correo</label>
          <input
            type="email"
            placeholder="tu@correo.com"
            value={form.correo}
            onChange={(e) => updateField("correo", e.target.value)}
            className={errors.correo ? "input-error" : ""}
          />
          {errors.correo && <span className="error-text">{errors.correo}</span>}
        </div>

        <div className="registro-group">
          <label>Contraseña</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              value={form.contrasena}
              onChange={(e) => updateField("contrasena", e.target.value)}
              className={errors.contrasena ? "input-error" : ""}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          {errors.contrasena && <span className="error-text">{errors.contrasena}</span>}
        </div>

        <div className="registro-group">
          <label>Confirmar Contraseña</label>
          <div className="password-wrapper">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Repite tu contraseña"
              value={form.confirmContrasena}
              onChange={(e) => updateField("confirmContrasena", e.target.value)}
              className={errors.confirmContrasena ? "input-error" : ""}
            />
            <button type="button" className="password-toggle" onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          {errors.confirmContrasena && <span className="error-text">{errors.confirmContrasena}</span>}
        </div>

        <div className="registro-group" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            id="privacidad"
            checked={aceptaPrivacidad}
            onChange={(e) => setAceptaPrivacidad(e.target.checked)}
            style={{ width: "auto" }}
          />
          <label htmlFor="privacidad" style={{ margin: 0, fontSize: "0.85rem" }}>
            Acepto el{" "}
            <a href="/aviso-privacidad" target="_blank" rel="noopener noreferrer">
              Aviso de Privacidad
            </a>
          </label>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        <a className="link link-primary" href="/">
          ¿Ya tienes cuenta? Inicia sesión
        </a>
      </form>

      <footer>© 2026 Jorima</footer>
    </main>
  );
}
