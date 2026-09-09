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

---

## Bloque 6 — Tab bar y navegación (solo móvil)

**Qué cambió:**
- `movil/app/(tabs)/_layout.tsx` reescrito: la pestaña activa dibuja una pastilla de fondo (`secondary` al 12%) con el ícono relleno; la inactiva no tiene fondo y el ícono va en su versión outline — la diferencia no depende solo del color, hay forma (requisito de accesibilidad del propio bloque). Los 4 íconos migraron de Feather/MaterialCommunityIcons mixtos a solo `MaterialCommunityIcons`, que sí tiene par outline/relleno para los cuatro (`home`, `clock`, `book-open`, `account`). La etiqueta se dibuja adentro de la pastilla junto al ícono, solo en la pestaña activa (`tabBarShowLabel: false` a nivel global) — así se resuelve de paso "esconder la etiqueta si el espacio aprieta" sin lógica extra. Barra a 76px de alto, borde superior de 2px, sin sombra.
- `movil/components/haptic-tab.tsx`: existía sin usarse desde el scaffold original de Expo. Se activó como `tabBarButton` y se cambió de `impactAsync` (solo iOS) a `Haptics.selectionAsync()` en ambas plataformas — es el tipo de háptico pensado para elegir entre opciones del mismo grupo, que es exactamente lo que es un tab bar.

**Verificado:** `tsc` limpio (mismos 3 errores preexistentes, ninguno nuevo). Sin emulador/dispositivo físico en este entorno para confirmar el háptico o ver la pastilla en vivo — revisado por lectura de código contra la documentación de Expo Router (`tabBarIcon` recibe `focused`, `tabBarButton` acepta un componente).

---

## Bloque 7 — Barras y anillos de progreso

**Qué cambió:**
- `movil/components/ProgressBar.tsx` (nuevo): barra gruesa, radio `full`, brillo blanco al 30% en el tercio superior de la porción llena. Anima con `react-native-reanimated` (`withTiming`, 400ms, ease-out) solo cuando `value` cambia de verdad, no en cada re-render; si `AccessibilityInfo.isReduceMotionEnabled()` es true, aparece directo. Instalado `react-native-svg` (no estaba).
- `movil/components/StressRing.tsx` (nuevo): anillo SVG, grosor 14, extremos redondeados, mismo criterio de animación/reduce-motion que la barra. Color por rango usando los acentos del bloque 1 (`success` bajo, `sol` medio, `coral` alto) — nunca los semánticos `warning`/`error`, que suenan a falla. Exporta `colorPorNivel` para que la pantalla que lo usa pinte el número del mismo color sin acoplarse al componente.
- `web/app/components/ProgressBar.tsx` y `StressRing.tsx` (nuevos): misma anatomía, animados con CSS puro (`transition: width`/`stroke-dashoffset`, apagada con `prefers-reduced-motion`) en vez de una librería — no había ninguna instalada y no hacía falta.
- Ambos se conectaron donde el dato **ya se estaba pidiendo** — `movil/(tabs)/estres.tsx` y `web/mi-bienestar/page.tsx` — reemplazando el círculo con borde a mano por el anillo (con la mascota adentro) y agregando una `ProgressBar` a cada una de las tres tarjetas de factor (ánimo, carga, chat). No se agregó ningún `fetch` nuevo: la regla del documento de no tocar la lógica de negocio se cumple usando datos que esas pantallas ya cargaban.

**Qué no se hizo igual que el doc, y por qué:**
- El documento sugiere usar el anillo "como encabezado de `(tabs)/home.tsx`, reemplazando el saludo plano" — pero `home.tsx` no pide el nivel de estrés (eso vive en `estres.tsx`/`mi-bienestar`), y agregar ese `fetch` ahí habría violado la regla explícita del propio documento de no tocar `los fetch de las pantallas`. Se usó la pantalla que ya tenía el dato en vez de la que el documento nombró.
- El documento también sugiere `ProgressBar` en `web/app/historial/page.tsx` — esa pantalla no tiene ninguna métrica 0–1 que mostrar (es una lista de conversaciones), así que se usó en `mi-bienestar` en su lugar, que sí tiene tres métricas de 0 a 100 ya calculadas.

**Verificado:** captura de `/mi-bienestar` con el anillo verde (nivel 25) con la mascota adentro, y las tres barras de progreso con su color y brillo correctos, una de ellas vacía (nivel 0) mostrando la pista sin relleno. Sin errores de consola. `tsc` limpio en ambos proyectos.

---

## Bloque 8 — Micro-feedback

**Qué cambió:**
- `movil/hooks/usePopAnimation.ts` (nuevo): extrae el patrón que vivía a mano dentro de `JorimaAvatar.tsx` (escala a 1.14, resorte de vuelta a 1) a un hook reutilizable — devuelve `{ escala, dispara }`. Respeta `AccessibilityInfo.isReduceMotionEnabled()`: si está activo, `dispara()` no hace nada.
- `web/app/hooks/usePopAnimation.ts` (nuevo): mismo hook, versión web — usa CSS (`transform`/`transition`) en vez de `Animated`, porque no hay runtime de React Native en el navegador. Misma curva (escala 1.14, mismo cubic-bezier tipo resorte que ya tenía `JorimaAvatarWeb`, solo ajustado de 1.12 a 1.14 para que coincida exacto con móvil). Respeta `prefers-reduced-motion`.
- `JorimaAvatar.tsx` y `JorimaAvatarWeb.tsx` migrados a su hook respectivo — ya no tienen la animación de pop escrita a mano.
- `movil/components/ThemedButton.tsx`: `Haptics.impactAsync(Light)` en `onPressIn`.
- `movil/app/(tabs)/home.tsx`: `Haptics.notificationAsync(Success)` al guardar ánimo/intención/carga con éxito (completar una pausa activa ya lo tenía, en `MensajeMotivadorFinal.tsx`, desde antes de este bloque). Nuevo `MoodOptionButton` — la opción de ánimo hace "pop" al seleccionarse, usando el mismo hook. El contador de tareas (+/-) también hace "pop" al cambiar, pero no en el montaje inicial (se guarda con un `ref` para no disparar nada sin que el usuario haya tocado algo).

**Qué no se hizo:**
- El sonido opcional con toggle en Perfil. El documento lo marca explícitamente como opcional, y no existe ningún asset de sonido ni configuración de audio en el proyecto — agregar un toggle sin un sonido real detrás habría sido una pieza de UI que no hace nada, más confusa que útil.

**Verificado:** `tsc` limpio en ambos proyectos (mismos 3 errores preexistentes de siempre en móvil, ninguno nuevo; 0 en web). Captura de `/usuarios` confirmando que el avatar web sigue renderizando bien tras el refactor del hook, sin errores de consola. El háptico y el pop del contador en móvil se revisaron por lectura de código — no hay dispositivo físico ni emulador en este entorno para sentir la vibración o ver la animación en vivo.

---

## Bloque 12 — Pausas activas como "lección" (bloques 9–11 saltados, ver nota)

**Qué cambió:**
- Nuevo `GET /api/relajacion/conteo`: cuenta total de `sesion_relajacion` completadas del usuario, para siempre — el contador acumulativo que pide el bloque 11 ("23 pausas activas desde que empezaste"), tomado de una tabla que ya existía, sin tocar el esquema.
- `MensajeMotivadorFinal.tsx` (móvil, con `react-native-confetti-cannon`) y `MensajeMotivadorFinalWeb.tsx` (web, con `canvas-confetti`): confeti al completar una pausa activa, mostrando también el contador de arriba. El confeti respeta reduce-motion/`prefers-reduced-motion` y solo existe en el camino de éxito — no hay ningún camino de "fallar" desde el que se pueda disparar, tal como pide el bloque 11 ("celebración sin castigo").
- `respiracion.tsx` y `estiramiento.tsx` (ambas plataformas): `ProgressBar` (bloque 7) arriba mostrando el avance real de la sesión, en `lavanda`. La "X" de salir ahora solo pide confirmación si el progreso pasa de la mitad — antes de eso, sale directo. Verificado con un caso por umbral: paso 1 (progreso 0) sale directo, paso 3 de 4 (progreso exactamente 0.5) sale directo, paso 4 de 4 (progreso 0.75) sí pide confirmar, y cancelar deja a la persona en la misma pantalla.
- Catálogo de relajación (`(relajacion)/index.tsx` en móvil, `relajacion/page.tsx` en web): tarjetas presionables con la anatomía del bloque 4, ahora en `lavanda` (nuevo prop `acento` en `PressableCard`). `burbujas.tsx` y `memorama.tsx` se dejaron sin tocar — son minijuegos interactivos, no una secuencia de instrucciones, y forzarlos a la estructura de "lección" habría significado reescribir su lógica de juego, no solo su presentación.

**Bug encontrado y corregido (del bloque 7, no de este):** `ProgressBar` en web nunca tenía ancho explícito — funcionaba por accidente en `mi-bienestar` porque ahí vive dentro de un contenedor de bloque normal (que estira a los hijos al 100% por defecto), pero se rompía (ancho 0, invisible) en cualquier contenedor `flex` como el que usa `respiracion`/`estiramiento`. Se le agregó `width: "100%"` explícito.

**Por qué se saltaron los bloques 9, 10 y 11 para llegar directo al 12:**
- El bloque 12 depende del 11 (contador acumulativo, celebración) y del 10 (trigger `celebrar` de una mascota animada) — ninguno de los dos existía. Se sustituyó el trigger de celebración por confeti + el mood `sonrisa_amplia` que ya existe (no hay un estado `celebracion` real todavía, eso es del bloque 9).
- El resto del bloque 11 (tabla de logros por hitos absolutos, resumen semanal) no se implementó — es una pieza de producto más grande, con su propio modelo de datos, que amerita su propia sesión de trabajo, no un efecto colateral de meter las pausas activas.

**Verificado en vivo (web):** capturas del catálogo (bordes lavanda), el paso 1 de estiramiento (barra en 0), el paso 4 (barra al 75% en lavanda), y la pantalla de cierre con confeti cayendo, la mascota sonriendo y "6 pausas activas desde que empezaste". Las tres pruebas de umbral de la confirmación de salida (antes, en el punto medio exacto, y pasado el medio) dieron el resultado esperado. Sin errores de consola. `tsc` limpio en ambos proyectos. Móvil revisado por tipos y lectura de código (sin emulador en este entorno).
