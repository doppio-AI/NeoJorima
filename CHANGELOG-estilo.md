# Changelog — migración visual estilo Duolingo

Registro por bloque, según `jorima-estilo-duolingo.md`. Una línea (o unas cuantas) por bloque terminado, con qué cambió y qué queda pendiente para el siguiente.

---

## Bloque 1 — Tokens de color y elevación sólida

**Qué cambió:**
- `movil/constants/colors.ts`: agregados `primaryShadow`, `secondaryShadow`, `sol`/`solShadow`, `lavanda`/`lavandaShadow`, `coral`/`coralShadow`; `background`, `border`, `text`, `textSecondary` actualizados a los valores nuevos. `border` ahora trae también `borderStrong`.
- `movil/constants/radius.ts`: reescrito a `sm: 12, md: 16, lg: 20, full: 999` (antes `sm/md/lg/xl/full` con otros valores). `xl` no se usaba en ningún otro archivo, se quitó sin impacto.
- `web/app/globals.css`: agregadas las variables `--c-primary`, `--c-secondary`, `--c-sol`, `--c-lavanda`, `--c-coral` (con sus `-shadow`), `--c-bg`, `--c-surface`, `--c-border`, `--c-border-strong`, `--radius-sm`, `--radius-md`, `--border-w`. `--radius-lg` pasó de `14px` a `20px` (afecta `.login-card`, inputs y `.btn-primary`, que ya lo usaban). Eliminadas `--shadow-md` y `--shadow-sm`.

**Qué no se hizo igual que el doc, y por qué:**
- El criterio de aceptación del bloque pide que `grep box-shadow` en `globals.css` solo devuelva reglas de `:focus-visible` — eso es en realidad el criterio del **bloque 4** (aparece duplicado en el documento). Aplicarlo aquí habría tocado ~15 reglas de tarjetas/botones fuera del alcance de "2 archivos" que este bloque se propone, y habría contradicho la propia regla del bloque de "nada cambió visualmente todavía de forma dramática". Las 8 reglas que sí usaban `var(--shadow-md)`/`var(--shadow-sm)` se dejaron con su valor literal anterior en línea, para que no perdieran su sombra silenciosamente al borrar las variables. El bloque 4 es quien debe reescribirlas de verdad con la anatomía de borde sólido.

**Pendiente para el siguiente bloque (4):** reemplazar esas ~15 reglas de `box-shadow` restantes (incluidas las 8 recién inlineadas) por la anatomía de borde de 2px + `border-bottom` de 4px.

---

## Bloque 2 — Tipografía redonda

**Qué cambió:**
- Móvil: instalado `@expo-google-fonts/nunito`. `constants/typography.ts` reescrito: cada variante declara `fontFamily` explícito (`Nunito_600SemiBold` / `_700Bold` / `_800ExtraBold`) según la tabla del documento, con `fontSize`/`lineHeight` propios. Se quitó el campo `fontWeight` que tenían antes las variantes — mezclarlo con un `fontFamily` de peso ya nombrado es un error común en RN/Android (puede forzar una fuente sintetizada o la del sistema). `app/_layout.tsx`: carga las 3 fuentes con `useFonts` y bloquea el render con `SplashScreen.preventAutoHideAsync()` / `hideAsync()` hasta que estén listas.
- Web: `app/layout.tsx` cambia de `Inter` a `Nunito` (pesos 600/700/800), variable `--font-nunito`. `app/page.tsx` (landing): `Fraunces` y `Plus_Jakarta_Sans` reemplazados por dos instancias de `Nunito` bajo los mismos nombres de variable (`--font-display`, `--font-body`) que ya consume `landing.module.css` — no fue necesario tocar ese archivo. Un `font-weight: 500` suelto en `.navLinks a` se subió a `600` para no pedir un peso que ya no se carga.

**Bug preexistente encontrado y corregido (no introducido por este bloque, pero bloqueaba su propio criterio de aceptación):**
- `--font-family` se definía en `:root` como `var(--font-inter), ...`, pero la clase que exponía `--font-inter` solo se aplicaba en `<body>`, un nivel por debajo de donde se necesitaba resolver. Un custom property que referencia otro que no existe todavía en ese elemento se vuelve "guaranteed-invalid" y esa invalidez se hereda — así que **toda la app, desde antes de este trabajo**, en realidad nunca renderizaba en Inter: cascadeaba al serif por defecto del navegador. Se corrigió aplicando la clase de la fuente en `<html>` en vez de (o además de) `<body>`.
- Un segundo bug relacionado y en el mismo archivo: la regla `body, button, input, select, textarea { font-family: inherit; }` tenía la misma especificidad que `body { font-family: var(--font-family); }` y, por venir después en el archivo, la pisaba con `inherit` — heredando de `<html>`, que tampoco tenía `font-family` propio. Se quitó `body` de esa lista de selectores (su intención real era que los controles de formulario no usaran la fuente nativa del SO, no que `body` heredara de sí mismo).
- Verificado visualmente con capturas de `/`, `/login`, `/usuarios` y `/historial`: las cuatro ahora resuelven `font-family` a Nunito con sus fallbacks correctos, sin errores de consola.

**Pendiente:** nada específico de este bloque. El bug de fuente encontrado quedó resuelto de raíz, no parcheado.
