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
