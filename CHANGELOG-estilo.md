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

---

## Bloque 3 — El botón chunky

**Qué cambió:**
- `movil/components/ThemedButton.tsx`: reescrito manteniendo la API pública (`title`, `variant`, `loading`, `onPress`, `disabled`). Contenedor externo (`Pressable`) que reserva `56 + 4px` de alto; la caja visual interna hunde su `borderBottomWidth` a 0 y baja `marginTop: 4` al presionar. Nueva variante `lavanda`. Estado deshabilitado sin opacidad (fondo `#E1E6EA`, texto `#9AA6AE`), tal como pide el documento.
- `web/app/globals.css`: `.btn-primary` reescrito con la anatomía de borde sólido (`border-bottom: 4px`, se hunde con `translateY(4px)` al `:active`). Nuevas `.btn-secondary` (azul) y `.btn-lavanda`, misma anatomía. Ninguna las usaba todavía, así que no hay riesgo de romper algo existente.

**De paso:** se corrigió un error de tipos preexistente en `ThemedButton.tsx` (el tipo de `style` heredado de `PressableProps` admite una forma de función que este componente nunca produce; se angostó la interfaz para aceptar solo `StyleProp<ViewStyle>`). Estaba ahí desde antes, solo cambió de línea al reescribir el archivo — se aprovechó para resolverlo de una vez.

**Verificado:** capturas del botón "Entrar" en `/login` en reposo y mientras se mantiene presionado con el mouse — el borde inferior desaparece y el botón baja 4px, sin saltos de layout. Sin errores de consola. El lado móvil se revisó por tipos y lectura de código (no hay emulador disponible en este entorno para capturarlo en vivo).

---

## Bloque 4 — Tarjetas, inputs y chips

**Qué cambió:**
- `movil/constants/theme.ts`: nuevo `SIZES.radiusLg` (20px, para tarjetas) junto al `SIZES.radius` existente (16px, botones/inputs).
- `movil/components/PressableCard.tsx` (nuevo): la versión "tarjeta" de `ThemedButton` — mismo hundimiento de borde al presionar, pero con `paddingBottom` reservado en vez de una altura fija, porque el contenido de una tarjeta es variable. La usan `recursos.tsx` y `(relajacion)/index.tsx`.
- `movil/components/ThemedInput.tsx`: altura 56, borde 2px, radio 16 (ya lo tenía), y ahora sí reacciona al foco (borde a 4px en `--secondary`).
- `movil/constants/styles.ts`, `(tabs)/recursos.tsx`, `(tabs)/perfil.tsx`, `(tabs)/historial.tsx`, `(tabs)/home.tsx`, `(relajacion)/index.tsx`: todas las tarjetas estáticas a border 2px + border-bottom 4px + radio `radiusLg`; `elevation` eliminado en todas partes. Los chips de categoría en `recursos.tsx` pasan a fondo `primary` al 10% con borde 2px del mismo tono, radio `full`. Las burbujas de chat (`historial.tsx`, `home.tsx`) pasan a radio 20 con la esquina del emisor en 6, la del asistente con borde 2px y la del usuario sólida en `secondary` sin borde. Los dos botones de confirmación de `home.tsx` (intención y carga), que eran `TouchableOpacity` a mano, se cambiaron por `ThemedButton` — heredan el hundimiento del bloque 3 gratis y quitan una duplicación de código.
- `web/app/globals.css`: `.card`, `.login-card`, `.admin-filterbar`, `.admin-empty-state`, `.historial-card` (+ su estado `:hover`/`.expanded`), `.mood-card`, `.chat-card`, `.registro-card`, `.perfil-card`, `.recursos-card-info`, `.table-wrapper` — todas sin `box-shadow`, con borde 2px + `border-bottom` 4px + `border-radius: var(--radius-lg)`. Inputs (`.form-group`, `.registro-group`, `.codigo-input`): borde 2px, radio 16, y el halo de foco (`box-shadow` difuso) reemplazado por `outline: 2px solid var(--c-secondary); outline-offset: 2px` — se eliminó una regla de foco duplicada y contradictoria que quedaba de antes. Nuevos tokens `--c-border`/`--c-border-strong`/`--c-bg`/`--c-surface` con su propia versión para `[data-theme="dark"]` (más claros que el fondo oscuro, no el mismo gris que en claro).

**Qué no se hizo igual que el doc, y por qué:**
- El criterio de aceptación pide que ningún `box-shadow` quede en `globals.css` fuera de foco. Quedan varios en elementos de **navegación** (`.admin-sidebar-brand`, `.sidebar-link.active`, el drawer móvil `.mobile-drawer`/`.sidebar.mobile-open`, `.sidebar-mobile-toggle`) — ninguno es una tarjeta, input o chip; son chrome de navegación que no tiene bloque propio asignado en este documento (el bloque 6 solo cubre el tab bar de móvil). Se dejaron intactos para no exceder el alcance de "tarjetas, inputs y chips", y porque el drawer en particular usa esa sombra con un propósito funcional (separarse visualmente del contenido detrás), no decorativo.
- `.registro-group` y `.codigo-input` no estaban en la lista de archivos del documento, pero tenían exactamente el mismo halo de foco que `.form-group` — se corrigieron también por consistencia (dejarlos con el halo viejo mientras el resto de la app usa el outline nuevo se habría visto como un descuido, no una decisión).

**Verificado:** capturas de `/usuarios` (tarjeta de chat con el borde y radio nuevos), `/historial` (tarjeta de conversación) y el input de correo de `/login` enfocado (outline limpio de 2px, sin halo difuso). Sin errores de consola. `tsc` limpio en ambos proyectos (solo los 4 errores preexistentes de siempre, ninguno nuevo). Móvil revisado por tipos/lectura de código.

---

## Bloque 5 — Vitrina de componentes

**Qué cambió (solo móvil, este bloque no tiene lado web):**
- `movil/app/design-system.tsx` reescrito por completo: paleta como swatches (nombre + hex, la tabla del bloque 1), las 7 variantes tipográficas (incluida `button`, que no es una variante de `ThemedText` — se muestra aplicando `FONTS.button` directo), los 4 tipos de botón en normal/cargando/deshabilitado, inputs vacío/con texto/enfocable, una tarjeta estática y una `PressableCard`, chips, y `JorimaAvatar` en sus 5 moods más `talking`.
- `movil/app/(tabs)/perfil.tsx`: nuevo botón "Vitrina de diseño (dev)" (variante `lavanda`), visible solo si `__DEV__`, que navega a `/design-system`.

**Verificado:** por tipos (`tsc` limpio, mismos 3 errores preexistentes de siempre) y lectura de código — no hay emulador en este entorno para capturarla en vivo, pero la pantalla no depende de red ni de sesión, así que un `expo start` debería mostrarla completa de inmediato.
