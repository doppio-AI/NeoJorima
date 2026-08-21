/**
 * Crea el primer superadmin del sistema.
 * Correrlo UNA sola vez, directo desde tu máquina (nunca expuesto como endpoint).
 *
 * Uso:
 *   npx tsx scripts/crear-superadmin.ts "correo@ejemplo.com" "ContraseñaSegura123" "Nombre" "Apellido"
 *
 * Si no tienes tsx instalado: npm install -D tsx
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [correo, contrasena, nombre, apellido_paterno] = process.argv.slice(2);

  if (!correo || !contrasena || !nombre || !apellido_paterno) {
    console.error(
      "Uso: npx tsx scripts/crear-superadmin.ts <correo> <contrasena> <nombre> <apellido_paterno>"
    );
    process.exit(1);
  }

  if (contrasena.length < 8) {
    console.error("La contraseña debe tener al menos 8 caracteres.");
    process.exit(1);
  }

  const correoNormalizado = correo.trim().toLowerCase();

  const existente = await prisma.usuario.findUnique({
    where: { correo: correoNormalizado },
  });

  if (existente) {
    console.error(`Ya existe una cuenta con el correo ${correoNormalizado}.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(contrasena, 10);

  const superadmin = await prisma.usuario.create({
    data: {
      tipo_usuario: 3,
      correo: correoNormalizado,
      nombre,
      apellido_paterno,
      contrasena: passwordHash,
      edificio_id: null,
      tipo_cuenta: "personal", // no aplica realmente, pero evita nulls raros
      onboarding_completo: true,
    },
  });

  console.log("✅ Superadmin creado:");
  console.log(`   usuario_id: ${superadmin.usuario_id}`);
  console.log(`   correo: ${superadmin.correo}`);
  console.log("\nYa puedes iniciar sesión en /superadmin con estas credenciales.");
}

main()
  .catch((error) => {
    console.error("Error al crear el superadmin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
