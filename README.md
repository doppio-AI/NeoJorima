# Jorima

> Plataforma web y móvil de bienestar laboral, clima organizacional e intervención temprana.

**Estado del documento:** consolidación técnica del proyecto al 14 de agosto de 2026.
**Propósito:** centralizar arquitectura, tecnologías, funcionalidades, configuración, contratos de integración, seguridad, deuda técnica y criterios de despliegue.

---

## 1. Descripción general

Jorima es una plataforma orientada a instituciones y empresas que busca detectar de forma temprana señales agregadas de estrés, desmotivación, sobrecarga laboral, burnout y otros riesgos psicosociales.

La solución contempla dos grupos principales:

- **Colaboradores, docentes y personal administrativo:** acceso al chat de bienestar, check-ins emocionales, encuestas y recursos de ayuda.
- **Psicología, Recursos Humanos, directivos y administradores:** acceso a métricas agregadas, tendencias, alertas preventivas, reportes y gestión de usuarios.

El enfoque declarado del producto es preventivo, empático, no invasivo y basado en datos agregados. La plataforma **no debe presentarse como sustituto de atención psicológica, médica o de emergencia**.

---

## 2. Estado real del proyecto

Este repositorio y la documentación histórica no están completamente alineados. Para evitar confusiones, se usan las siguientes etiquetas:

| Estado | Significado |
|---|---|
| ✅ Implementado o confirmado | Existe evidencia directa en código o configuración analizada. |
| 🟡 Documentado o planeado | Aparece en requerimientos, presentaciones o arquitectura, pero no se confirmó su implementación completa. |
| 🔴 Pendiente o inconsistente | Existe una brecha técnica, riesgo o contradicción que debe resolverse. |

### Resumen ejecutivo

- ✅ La aplicación web utiliza **Next.js, React, TypeScript, API Routes, Prisma y PostgreSQL**.
- ✅ El chat de bienestar consume la **API de Gemini de forma directa** desde el backend de Next.js. La integración con n8n fue retirada por completo del sistema.
- ✅ El flujo de autenticación es **de un solo paso**: cifrado híbrido RSA/AES de credenciales y verificación con bcrypt. El mecanismo de verificación por correo (2FA) fue eliminado y ya no forma parte del producto.
- ✅ El backend de la web está integrado en el mismo proyecto Next.js.
- ✅ Existen modelos para usuarios, conversaciones, mensajes, check-ins y predicciones. El modelo `codigo_verificacion` permanece en el esquema por motivos históricos, pero está **en desuso** y no debe considerarse parte del flujo activo.
- ✅ Existe una aplicación móvil en **React Native con Expo**.
- 🟡 La documentación histórica solicitaba JWT, pero el código analizado utiliza cookies con información serializada; no se ha confirmado un JWT real.
- 🟡 Se espera que la respuesta de Gemini incluya sentimiento, categoría y nivel de riesgo, pero el endpoint actual solo conserva el texto de la respuesta.
- 🔴 Las conversaciones están relacionadas con `usuario_id`, lo cual contradice cualquier promesa de anonimato total.
- 🔴 No deben almacenarse passwords, API keys ni llaves privadas dentro de este README ni del repositorio.

---

## 3. Arquitectura

```mermaid
flowchart LR
    U[Usuario web] --> WEB[Next.js / React]
    M[Aplicación móvil Expo] --> API[API Routes de Next.js]
    WEB --> API

    API --> AUTH[Autenticación y sesión]
    API --> CHAT[Servicio de conversaciones]
    API --> MOOD[Check-in emocional]
    API --> ADMIN[Administración y dashboard]

    AUTH --> DB[(PostgreSQL)]
    CHAT --> DB
    MOOD --> DB
    ADMIN --> DB

    CHAT --> GEMINI[Gemini API]

    MOOD --> ML[TensorFlow.js / predicción]
    ML --> DB
```

### Responsabilidades actuales

#### Frontend web

- Login y navegación según rol.
- Interfaz de chat.
- Check-in emocional.
- Vistas administrativas y dashboards.
- Consumo de rutas `/api/*` del mismo despliegue Next.js.

#### Backend Next.js

- Validación de solicitudes.
- Autenticación.
- Descifrado de credenciales.
- Comparación de contraseñas.
- Gestión de conversaciones y mensajes.
- Consulta del historial del chat.
- Persistencia mediante Prisma.
- Comunicación directa con la API de Gemini.
- Procesamiento de check-ins y predicciones.

#### Base de datos

- Usuarios y roles.
- Conversaciones y mensajes.
- Check-ins emocionales.
- Predicciones de riesgo.
- Datos institucionales y agregaciones.

> **Nota:** n8n dejó de ser parte de la arquitectura. Cualquier referencia a workflows, webhooks o credenciales de n8n en documentos anteriores debe considerarse obsoleta.

---

## 4. Tecnologías

### 4.1 Stack confirmado

| Capa | Tecnología | Uso |
|---|---|---|
| Web | Next.js | Aplicación web, renderizado y API Routes. |
| UI web | React | Componentes e interacción. |
| Lenguaje | TypeScript | Tipado del frontend y backend. |
| Backend | Next.js Route Handlers | Endpoints internos bajo `/api`. |
| ORM | Prisma | Acceso y modelado de la base de datos. |
| Base de datos | PostgreSQL | Persistencia principal. |
| Password hashing | bcrypt / bcryptjs | Comparación y almacenamiento seguro de contraseñas. |
| Cifrado de login | RSA + AES-256-CBC | Cifrado híbrido de credenciales entre cliente y servidor. |
| IA conversacional | Google Gemini API | Generación de respuestas del chat de bienestar, consumida directamente desde el backend. |
| Predicción | TensorFlow.js | Procesamiento o predicción de riesgo a partir de check-ins. |
| Móvil | React Native + Expo | Aplicación móvil. |
| Navegación móvil | Expo Router | Rutas y pestañas. |
| Estilos móvil | `twrnc` | Utilidades estilo Tailwind para React Native. |
| Hosting web | Vercel | Despliegue previsto o utilizado para el proyecto Next.js. |

### 4.2 Tecnologías documentadas pero no confirmadas en la versión actual

- Laravel.
- Java.
- MySQL.
- JWT como mecanismo real de sesión.
- Redis o una cola dedicada.
- Docker en todos los entornos.
- JMeter para carga.
- UptimeRobot para disponibilidad.
- PM2 como gestor de procesos.

Estas tecnologías aparecen en documentos de propuesta o requerimientos. No deben declararse como parte activa del sistema sin comprobar el repositorio y la infraestructura vigente.

### 4.3 Tecnologías retiradas

- **n8n** (orquestación de chat y envío de correos de verificación).
- **Verificación en dos pasos (2FA) por correo electrónico.**
- Proveedor SMTP asociado al envío de códigos de verificación.

Estas piezas fueron parte de versiones anteriores del producto y ya no deben documentarse como funcionalidad activa, ni deben conservarse variables de entorno, credenciales o referencias a ellas en el código.

---

## 5. Estructura esperada del repositorio

La estructura exacta puede variar, pero el análisis del código recuperado identifica componentes similares a los siguientes:

```text
jorima/
├─ app/
│  ├─ api/
│  │  ├─ chat/route.ts
│  │  ├─ login/route.ts
│  │  ├─ public-key/route.ts
│  │  └─ respuesta/route.ts
│  ├─ usuarios/page.tsx
│  └─ ...
├─ lib/
│  ├─ prisma.ts
│  ├─ rsa.ts
│  └─ ml.ts
├─ prisma/
│  └─ schema.prisma
├─ public/
├─ middleware.ts
├─ package.json
├─ .env.example
└─ README.md
```

La ruta `verificar-codigo` y la carpeta `docs/n8n/` ya no aplican y deben eliminarse de cualquier estructura futura del repositorio.

---

## 6. Funcionalidades

### 6.1 Requerimientos funcionales

| ID | Funcionalidad | Estado |
|---|---|---|
| RF-01 | Gestión de usuarios y roles: alta, consulta, edición y baja lógica. | 🟡 Parcial / por verificar |
| RF-02 | Login seguro, con roles, sesión y cierre de sesión. | ✅ Implementado, sin verificación en dos pasos |
| RF-03 | System prompt del asistente de bienestar. | 🟡 Debe reconstruirse y versionarse |
| RF-04 | Integración del chat con la API de Gemini. | ✅ Implementado de forma directa desde el backend |
| RF-05 | Interfaz de chat web y móvil. | ✅ Web identificada; móvil por verificar |
| RF-06 | Análisis de sentimiento, categoría y nivel de riesgo. | 🔴 No persistido por el backend actual |
| RF-07 | Check-in emocional diario. | ✅ Implementación identificada |
| RF-08 | Encuestas anónimas de clima organizacional. | 🟡 Planeado / por verificar |
| RF-09 | Anonimización irreversible de respuestas. | 🔴 No garantizada en todos los módulos |
| RF-10 | Dashboard de métricas y tendencias agregadas. | 🟡 Parcial / por verificar |
| RF-11 | Alertas preventivas de riesgo psicosocial. | 🟡 Planeado |
| RF-12 | Repositorio de recursos de ayuda. | 🟡 Planeado / por verificar |

### 6.2 Roles de aplicación previstos

- **Superadministrador**
- **Administrador**
- **Psicólogo u orientador**
- **Directivo**
- **Colaborador**
- **Docente**
- **Personal administrativo**

La codificación exacta de `tipo_usuario` debe documentarse desde la base de datos. El análisis previo sugiere valores numéricos, pero no existe evidencia suficiente para publicar una tabla definitiva sin revisar el esquema y los seeds actuales.

### 6.3 Roles de proyecto

| Integrante | Rol PMI registrado |
|---|---|
| Ricardo Porras Reyes | Project Manager |
| Erick Said Sánchez | PMO |
| José Martín López González | PMO |
| Diego Jesús Reyes Rebolledo | Cliente/Usuario o Team Member, según el documento consultado |

Existe una inconsistencia documental sobre el rol de Diego. Debe corregirse en la documentación oficial del proyecto.

---

## 7. Autenticación y seguridad

### 7.1 Flujo de login confirmado

1. El frontend solicita la llave pública mediante `GET /api/public-key`.
2. El cliente genera una llave AES y un vector de inicialización.
3. Las credenciales `{ correo, contrasena }` se cifran con AES-256-CBC.
4. La llave AES se cifra con RSA.
5. El cliente envía `encryptedData`, `encryptedKey` e `iv` a `POST /api/login`.
6. El backend descifra el contenido.
7. Busca el usuario por correo.
8. Compara la contraseña con el hash usando bcrypt.
9. Si la contraseña es válida, el backend crea la sesión y devuelve las cookies correspondientes.

El flujo de verificación en dos pasos (2FA) fue retirado del producto. El acceso se otorga inmediatamente después de validar la contraseña, sin código de confirmación por correo.

### 7.2 Diferencia entre requerimiento y código

La documentación histórica solicitaba JWT. El código recuperado registra una cookie `usuario` con `httpOnly` y otra cookie `usuario_public` accesible desde cliente. No se ha confirmado que el valor esté firmado como JWT.

**Conclusión:** no debe afirmarse que Jorima usa JWT hasta que se implemente o se confirme en la versión actual.

### 7.3 Reglas mínimas

- Nunca guardar contraseñas en texto plano.
- Usar bcrypt con un factor de costo adecuado.
- No imprimir llaves, credenciales descifradas ni tokens de sesión en logs.
- Aplicar expiración de sesión.
- Limitar intentos de login.
- Usar HTTPS en producción.
- Validar autorización dentro de cada API sensible.
- No confiar únicamente en el middleware.
- Implementar rotación de secretos.
- Separar datos de identidad de datos emocionales.
- Proteger la API key de Gemini como secreto de servidor; nunca exponerla al cliente.

---

## 8. Contraseñas, llaves y secretos

### Advertencia

**No se deben guardar passwords reales, API keys, llaves privadas, cadenas de conexión ni credenciales en este README, en Git o en capturas.**

No se recuperaron valores confiables de contraseñas del material disponible. Inventarlos sería inútil y documentar secretos reales aquí sería una vulnerabilidad.

Los valores deben almacenarse en:

- Variables de entorno locales.
- Vercel Environment Variables.
- Un gestor de secretos del proveedor de infraestructura.
- Un password manager compartido con acceso restringido.

### Variables de entorno sugeridas

```env
# Aplicación
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=replace-with-a-long-random-secret

# Base de datos
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
DIRECT_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public

# IA
GEMINI_API_KEY=
GEMINI_MODEL=

# RSA
RSA_PUBLIC_KEY=
RSA_PRIVATE_KEY=

# Móvil
EXPO_PUBLIC_API_URL=http://LOCAL_IP:3000

# CORS, solo si existe un backend separado
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://LOCAL_IP:8081
```

### Inventario de secretos

| Secreto | Variable | Responsable sugerido | Estado |
|---|---|---|---|
| Cadena de PostgreSQL | `DATABASE_URL` | Backend / DBA | Valor no documentado |
| Conexión directa Prisma | `DIRECT_URL` | Backend / DBA | Valor no documentado |
| Firma de sesión | `SESSION_SECRET` | Backend | Requiere definición |
| API key de Gemini | `GEMINI_API_KEY` | Backend | Debe salir del código y protegerse como secreto de servidor |
| Llave privada RSA | `RSA_PRIVATE_KEY` | Backend / DevOps | No debe exponerse |

---

## 9. API conocida

### 9.1 `GET /api/public-key`

Devuelve la llave pública RSA usada por el frontend para cifrar la llave AES.

### 9.2 `POST /api/login`

#### Entrada

```json
{
  "encryptedData": "base64",
  "encryptedKey": "base64",
  "iv": "base64"
}
```

#### Responsabilidades

- Descifrar credenciales.
- Validar usuario.
- Comparar contraseña.
- Crear la sesión y devolver las cookies correspondientes.

### 9.3 `POST /api/chat`

#### Entrada

```json
{
  "usuario_id": 1,
  "mensaje": "Me siento agotado por la carga de trabajo.",
  "conversacion_id": 15
}
```

`conversacion_id` puede ser opcional. Si no existe, el backend crea una conversación.

#### Salida esperada

```json
{
  "conversacion_id": 15,
  "respuesta": "Entiendo que la carga te esté afectando..."
}
```

El backend construye el mensaje y el historial de la conversación, y los envía directamente a la API de Gemini para generar la respuesta del asistente.

### 9.4 `POST /api/respuesta`

Ejemplo de check-in:

```json
{
  "edificio_id": 1,
  "respuestas": {
    "estado_animo": "bien"
  }
}
```

Valores identificados:

```text
muy mal
mal
regular
bien
muy bien
```

### Inconsistencia de ruta

Los requerimientos mencionan `/api/auth/login`, pero el código analizado utiliza `/api/login`. Debe elegirse una ruta oficial y actualizar código, documentación y clientes.

---

## 10. Integración con Gemini API

### Objetivo

Recibir el mensaje y el historial de la conversación desde `/api/chat`, invocar el modelo de Gemini y devolver una respuesta normalizada al frontend.

### Flujo actual

```text
POST /api/chat
  -> Guardar mensaje del usuario
  -> Construir historial de la conversación
  -> Llamar a la API de Gemini con el mensaje y el historial
  -> Normalizar la respuesta del modelo
  -> Guardar la respuesta del asistente
  -> Responder al frontend
```

### System prompt base sugerido

```text
Eres Jorima, un asistente de bienestar laboral e institucional.

Escucha con empatía, claridad y prudencia. No diagnostiques enfermedades,
no recetes medicamentos y no afirmes que el usuario tiene un trastorno.

Si detectas peligro inmediato, violencia, autolesión o crisis, ofrece una
respuesta de contención y recomienda contactar servicios de emergencia
o apoyo institucional. No prometas confidencialidad absoluta si el sistema
no puede garantizarla técnicamente.

Responde en español, con tono humano, breve y no invasivo. Usa el historial
solo para mantener continuidad. No inventes datos.
```

Este prompt es una propuesta base y debe versionarse junto con el código.

### Versión futura estructurada

```json
{
  "respuesta": "Texto visible",
  "sentimiento": "negativo",
  "categoria": "carga_trabajo",
  "riesgo": "alto",
  "alerta": false
}
```

El backend actual solo conserva el campo `respuesta`. Para aprovechar sentimiento, categoría, riesgo y alerta será necesario extender el modelo de datos y el endpoint `/api/chat` para persistir esta información de forma estructurada.

### Nota sobre la migración

La integración anterior dependía de un servidor externo de n8n para orquestar el chat y el envío de correos de verificación. Esa dependencia fue eliminada: el chat ahora llama directamente a la API de Gemini desde el backend de Next.js, lo que reduce puntos de falla, elimina la necesidad de mantener una instancia externa y simplifica el contrato de datos.

---

## 11. Modelo de datos identificado

### `usuario`

Campos relevantes:

```text
usuario_id
tipo_usuario
correo
nombre
apellido_paterno
apellido_materno
contrasena
edificio_id
turno
fecha_registro
```

### `conversacion`

```text
conversacion_id
usuario_id
titulo
fecha_creacion
activa
```

### `mensaje`

```text
mensaje_id
conversacion_id
role
texto
fecha
```

Valores esperados en `role`:

```text
user
assistant
```

### `codigo_verificacion` (en desuso)

```text
codigo_id
usuario_id
codigo
fecha_creacion
fecha_expiracion
usado
```

Este modelo corresponde al flujo de verificación en dos pasos que ya no forma parte del producto. Se mantiene documentado únicamente por trazabilidad histórica; su eliminación del esquema y de la base de datos debe evaluarse en una migración planeada, no debe usarse en desarrollo nuevo.

### `respuesta`

```text
respuesta_id
edificio_id
respuestas JSON
fecha
```

### `riesgo_prediccion`

```text
id
edificio_id
fecha
respuestas
riesgo_base
riesgo_proyeccion_30d
created_at
```

### Problema de privacidad

`conversacion.usuario_id` permite asociar el historial de chat con una persona. Por ello, el módulo de chat **no es anónimo** en su forma identificada. Si el producto promete anonimato total, el diseño debe cambiar o la comunicación comercial debe ser corregida.

Una alternativa realista es hablar de:

- Confidencialidad.
- Acceso restringido.
- Seudonimización.
- Métricas agregadas para psicólogos y directivos.

No debe usarse la palabra "anonimato" de forma absoluta mientras exista un vínculo reversible con el usuario.

---

## 12. Aplicación móvil

### Estado conocido

- Ruta de trabajo histórica: `C:\Jorima\jorima-mobile`.
- Node.js utilizado: `20.14.0`.
- Expo: `~54.0.33`.
- Expo Router: `~6.0.23`.
- Navegación por tabs.
- `twrnc` operativo.

### Conexión durante desarrollo

Un teléfono físico no puede consumir `localhost` de la computadora. Debe usarse la IP local:

```env
EXPO_PUBLIC_API_URL=http://192.168.X.X:3000
```

El equipo y el teléfono deben estar en la misma red. El servidor Next.js debe escuchar conexiones externas y el firewall debe permitir el puerto.

En producción, la app móvil debe usar la URL pública de Vercel o del backend desplegado.

---

## 13. Web y backend en Vercel

Al usar Next.js con Route Handlers, frontend y backend pueden compartir el mismo dominio.

Ejemplo:

```text
Web:
https://jorima.example.com

Backend:
https://jorima.example.com/api/login
https://jorima.example.com/api/chat
```

No es necesario un dominio separado para el backend mientras las APIs residan dentro del mismo proyecto Next.js.

### Consideraciones

- Configurar todas las variables en Vercel, incluida `GEMINI_API_KEY`.
- No subir `.env`.
- Verificar que Prisma sea compatible con la conexión desplegada.
- Usar `DIRECT_URL` cuando el proveedor de PostgreSQL lo requiera para migraciones.
- Revisar límites de tiempo de las funciones serverless, especialmente en llamadas a Gemini.
- No depender de archivos locales persistentes.
- Configurar dominios permitidos y cookies seguras.
- Usar `Secure`, `HttpOnly` y una política `SameSite` apropiada.

---

## 14. Diseño visual

### Paleta

- Primary: `#0F4C81`
- Secondary: `#2A9D8F`
- Neutrales: Gray 50, 100, 300, 500 y 900.

### Tipografía

- Familia principal: **Inter**.
- H1: 36 px, peso 600.
- H2: 30 px, peso 600.
- H3: 24 px, peso 600.
- H4: 20 px, peso 500.
- Body: 16 px, peso 400, line-height aproximado 1.6.
- Small: 14 px, peso 400.

### Componentes

- Botones primary, secondary, outline, ghost y disabled.
- Radio principal de botones: 12 px.
- Cards: radio 16 px, padding 24 px, borde neutral y sombra suave.
- Inputs con estados normal, focus, error, success y disabled.
- Áreas táctiles móviles de al menos 44 × 44 px.
- Diseño responsive desde 320 px.

### Principios

- Confianza.
- Calma.
- Claridad.
- Empatía.

---

## 15. Requerimientos no funcionales

| Área | Objetivo documentado | Observación |
|---|---|---|
| Seguridad | HTTPS, cifrado, hashing y accesos por rol. | Requiere endurecimiento adicional. |
| Latencia | Respuesta del chat menor a 5 s en condiciones normales. | Depende de la API de Gemini y del hosting. |
| Disponibilidad | Objetivo de 99.5 % en horario operativo. | No se confirmó monitoreo o SLA real. |
| Compatibilidad | Web responsive, Android, iOS, Windows y macOS. | Requiere matriz de pruebas. |
| Escalabilidad | Concurrencia inicial de 50 usuarios activos. | La meta histórica de 10,000 simultáneos exige rediseño. |
| Dashboard | Consultas menores a 3 s con 50,000 registros. | Requiere índices y pruebas. |
| Recuperación | Reinicio automático y manejo de errores. | Debe documentarse el plan real. |

### Nota sobre escalabilidad

Existe una diferencia importante entre documentos:

- Un requerimiento plantea un mínimo de **50 usuarios activos simultáneos**.
- La arquitectura académica discutida contempla picos de hasta **10,000 usuarios simultáneos**.

No son objetivos equivalentes. Soportar 10,000 usuarios requiere colas, rate limiting, observabilidad, caché, escalamiento horizontal, pruebas de carga y, posiblemente, separar el backend de las funciones serverless actuales.

---

## 16. Instalación local

### Requisitos

- Node.js 20 o compatible con el `package.json`.
- npm, pnpm o yarn según el lockfile.
- PostgreSQL accesible.
- API key de Gemini.
- Git.

### Web

```bash
git clone <REPOSITORY_URL>
cd <PROJECT_DIRECTORY>
npm install
cp .env.example .env.local
npx prisma generate
npm run dev
```

Abrir:

```text
http://localhost:3000
```

### Base de datos

Para un entorno nuevo:

```bash
npx prisma migrate dev
```

Para producción:

```bash
npx prisma migrate deploy
```

**No ejecutar migraciones destructivas sobre una base existente sin backup y revisión del SQL.**

### Aplicación móvil

```bash
cd jorima-mobile
npm install
npx expo start
```

Configurar:

```env
EXPO_PUBLIC_API_URL=http://IP_LOCAL_DEL_EQUIPO:3000
```

---

## 17. Pruebas mínimas

### Autenticación

- Login con credenciales válidas.
- Login con correo inexistente.
- Login con contraseña incorrecta.
- Usuario inactivo.
- Límite de intentos.

### Chat

- Mensaje vacío.
- Mensaje válido.
- Creación de conversación.
- Recuperación del historial.
- Respuesta de Gemini.
- Timeout de la API de Gemini.
- JSON inválido.
- Error 429.
- Error 500.
- Mensaje de crisis.
- Persistencia de `user` y `assistant`.

### Seguridad

- SQL injection.
- XSS almacenado y reflejado.
- Acceso a APIs sin sesión.
- Manipulación de `usuario_id`.
- Manipulación de roles.
- CSRF.
- CORS.
- Cookies.
- Rate limiting.
- Fuga de secretos en logs.
- Enumeración de usuarios.

### Check-in

- Cada valor permitido.
- Valor inválido.
- Duplicidad diaria.
- Edificio incorrecto.
- Agregación sin identidad.
- Predicción e invalidación de caché.

### Rendimiento

- Tiempo de respuesta p50, p90 y p95.
- 50 usuarios concurrentes.
- Fallo controlado de la API de Gemini.
- Fallo controlado de PostgreSQL.
- Rate limit del proveedor de IA.

---

## 18. Deuda técnica prioritaria

### Prioridad crítica

1. Eliminar cualquier referencia residual a n8n en código, configuración o documentación.
2. Eliminar logs de llaves y credenciales descifradas.
3. Rechazar llaves AES inválidas; no rellenarlas con ceros.
4. Proteger cada API sensible con autenticación y autorización.
5. Implementar una sesión firmada o JWT real.
6. Evitar que el cliente pueda suplantar otro `usuario_id`.
7. Definir honestamente el modelo de privacidad.
8. Rotar cualquier secreto que haya sido expuesto anteriormente, incluida la API key de Gemini.
9. Implementar rate limiting en login y chat.
10. Evaluar la eliminación formal del modelo `codigo_verificacion` y del flujo de 2FA en una migración planeada.

### Prioridad alta

1. Corregir `edificio_id: 1` hardcodeado.
2. Persistir análisis de sentimiento, categoría y riesgo devueltos por Gemini.
3. Definir una taxonomía cerrada.
4. Añadir índices de base de datos.
5. Implementar baja lógica y estados de usuario.
6. Unificar `/api/login` y `/api/auth/login`.
7. Agregar validación de esquema con Zod o equivalente.
8. Normalizar respuestas y errores de API.
9. Añadir observabilidad sin registrar contenido sensible.
10. Crear pruebas automatizadas.

### Prioridad media

1. Documentar el diccionario de datos.
2. Crear manual técnico y manual de usuario.
3. Construir matriz de compatibilidad.
4. Agregar página de mantenimiento.
5. Definir backups y recuperación.
6. Implementar recursos institucionales administrables.
7. Corregir inconsistencias de roles y fechas en documentos.

---

## 19. Privacidad y ética

Jorima procesa información potencialmente sensible. El producto debe adoptar, como mínimo, los siguientes principios:

- Minimización de datos.
- Consentimiento informado.
- Propósito limitado.
- Separación entre identidad y respuestas.
- Acceso por necesidad.
- Retención definida.
- Eliminación segura.
- Auditoría.
- Transparencia sobre el uso de IA.
- Supervisión humana.
- Protocolo de crisis.
- Prohibición de diagnósticos automáticos.
- Prohibición de decisiones laborales sancionatorias basadas únicamente en IA.
- Umbrales mínimos de agrupación para evitar reidentificación de equipos pequeños.

La documentación actual utiliza referencias normativas inconsistentes. Antes de presentar cumplimiento legal o certificaciones, el equipo debe validar la norma aplicable con asesoría competente.

---

## 20. Roadmap técnico sugerido

### Fase 1 — Estabilización

- Confirmar la integración directa con Gemini como único canal del chat.
- Retirar de forma definitiva cualquier configuración, dependencia o mención a n8n.
- Mover configuración sensible a variables de entorno.
- Corregir autenticación y autorización.
- Crear `.env.example` actualizado.

### Fase 2 — Datos y privacidad

- Separar identidad y bienestar.
- Implementar seudonimización.
- Definir política de retención.
- Corregir edificio y agrupaciones.
- Agregar metadatos estructurados del chat (sentimiento, categoría, riesgo).

### Fase 3 — Calidad

- Pruebas unitarias e integración.
- Pruebas de seguridad.
- Pruebas de carga.
- Observabilidad.
- Backups.
- Runbooks de incidentes.

### Fase 4 — Escalabilidad

- Cola de trabajos.
- Reintentos con backoff exponencial.
- Caché.
- Rate limiting distribuido.
- Procesamiento asíncrono.
- Escalamiento horizontal.
- Separación de servicios si la carga lo justifica.

---

## 21. Criterios de terminado

Una funcionalidad no se considera terminada solo porque "funciona en la computadora del desarrollador". Debe cumplir:

- Código revisado.
- Validaciones de entrada.
- Autorización.
- Manejo de errores.
- Sin secretos en código.
- Pruebas.
- Documentación.
- Métricas o logs seguros.
- Despliegue reproducible.
- Evidencia de aceptación.
- Plan de rollback cuando aplique.

---

## 22. Documentación fuente

Documentos internos disponibles:

- Requerimientos funcionales y no funcionales.
- Guía de estilos.
- Propuesta de valor Canvas.
- Presentación de propuesta.
- Roles PMI.
- Minuta interna.
- Material de identidad de Jorima Tech.

Cuando exista una contradicción, el código desplegado y las decisiones técnicas vigentes deben prevalecer sobre documentos antiguos, pero la desviación debe registrarse.

---

## 23. Equipo

- Erick Said Sánchez.
- Diego Jesús Reyes Rebolledo.
- José Martín López González.
- Ricardo Porras Reyes.

---

## 24. Licencia

No se recuperó una licencia explícita. Mientras no se defina, el código debe considerarse privado y de uso restringido por el equipo y la institución.

---

## 25. Contacto y mantenimiento

Definir antes de producción:

```text
Product Owner:
Project Manager:
Responsable backend:
Responsable frontend:
Responsable móvil:
Responsable de integración con Gemini:
Responsable de base de datos:
Responsable de seguridad:
Contacto de psicología:
Correo de soporte:
Canal de incidentes:
```

---

## Conclusión

Jorima ya tiene una base técnica recuperable, pero no debe confundirse una demostración funcional con una plataforma lista para manejar información emocional sensible en producción.

Las prioridades reales son seguridad, privacidad, autorización, consistencia documental y pruebas. Agregar más pantallas antes de resolver esos puntos aumentaría la deuda y el riesgo.
