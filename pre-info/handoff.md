# D-Calendar — handoff para Expo / React Native

Prototipo HTML de referencia: `Pantalla principal.dc.html` (canvas con todas las pantallas).
Cada pantalla vive en su propio archivo: `Pantalla.dc.html` (home + drawer), `Crear.dc.html`,
`Ajustes.dc.html`, `Ayuda.dc.html`, `Acerca.dc.html`.

Los nodos clave del prototipo llevan `data-rn="Componente"` y `data-rn-note="…"` con el
comportamiento esperado. Úsalos como mapa HTML → componente RN.

---

## 1. Base del proyecto

- Expo SDK 51+, TypeScript, `expo-router` (file-based).
- Fuentes: `@expo-google-fonts/roboto-slab` (300/400/500) y `@expo-google-fonts/roboto-mono`
  (solo si el usuario activa "fuente monoespaciada" en Ajustes).
- Iconos: `phosphor-react-native`. Peso `regular`; el kebab de cuentas usa `bold`.
- Sin librería de UI: todo con `View`/`Text`/`Pressable` + StyleSheet.
- Gestos y animación: `react-native-gesture-handler` + `react-native-reanimated`.
- Feedback háptico: `expo-haptics`.
- Diseñado a 412×892 (Android). Respetar safe-area arriba y abajo con
  `react-native-safe-area-context`; el padding lateral del contenido es 12.

## 2. Tokens

```ts
export const color = {
  bg:        '#0a0a0b',  // fondo de pantalla
  box:       '#101012',  // caja grande (home)
  surface:   '#121214',  // superficie de item / caja conectada
  card:      '#141417',  // tarjeta, input, control
  cardHover: '#17171a',  // estado pressed de una fila
  line:      '#1c1c21',  // separador 1px
  border:    '#26262c',  // borde de control
  borderMut: '#1f1f24',  // borde de caja
  text:      '#f0f0f2',
  textSoft:  '#dcdce1',
  textMuted: '#8a8a93',
  label:     '#6e6e76',  // micro-etiqueta
  labelDim:  '#55555d',
  faint:     '#4d4d55',
  accent:    '#e5252f',  // configurable en Ajustes
};
export const radius = { box: 26, card: 18, control: 13, chip: 12, joined: 9 };
export const space  = { screen: 12, box: 16, row: 10, gap: 5 };
```

**El acento es una preferencia**, no una constante: Ajustes › Apariencia lo cambia entre
6 valores fijos (`#e5252f #e5a020 #3fae6b #3d7fe0 #9184d9 #b9b9c1`). Exponerlo por contexto
(`useAccent()`) y usarlo en: día de hoy, puntos de evento, check de tarea, hábito completado,
CTA principal, switches activos. Nada más va en color.

**Tipografía** — todo Roboto Slab: título de pantalla 19/500, título de tarjeta 12.5–14/300,
cuerpo 11.5–12.5/300, micro-etiqueta 8.5–10 en MAYÚSCULAS con `letterSpacing` 1.1–1.8.
Mínimo absoluto 8px (solo micro-etiquetas).

## 3. Movimiento

Un solo set de duraciones; no inventar otras.

| Uso | Duración | Easing |
|---|---|---|
| Hover / pressed / cambio de color | 180 ms | `ease` |
| Cambio de estado (check, switch, tarjeta completada) | 220 ms | `ease` |
| Tachado del hábito (ancho 0→100%) | 300 ms | `cubic-bezier(.2,.8,.2,1)` |
| Drawer y bottom sheets (translate) | 300–320 ms | `cubic-bezier(.2,.8,.2,1)` |
| Overlay (opacidad 0→0.55) | 280 ms | `ease` |
| Pulso al completar hábito (scale 1→0.94→1) | 320 ms | `ease` |

Ajustes › Accesibilidad › **Reducir animaciones** debe poner todas estas duraciones a 0
(salvo el overlay, que puede quedarse en un fade de 100 ms). Respetar también
`AccessibilityInfo.isReduceMotionEnabled()`.

## 4. El "gap Nothing"

Dos variantes, ambas presentes en el diseño. No mezclarlas dentro de un mismo grupo.

**a) Separadas (Ajustes, lista de ayuda).** Items con `gap: 5`. El radio de la esquina que
da al gap es menor que el de la exterior: primero `26 26 9 9`, intermedios `9`, último
`9 9 26 26`. Sin conector: aquí el gap queda vacío. Helper:

```ts
// Ajustes/Ayuda: (26, 9). Vista semanal (variante b, en horizontal): (17, 6).
const groupRadius = (i: number, n: number, outer = 26, inner = 9) =>
  n === 1 ? outer
  : i === 0     ? [outer, outer, inner, inner]
  : i === n - 1 ? [inner, inner, outer, outer]
  : inner;
```

**b) Conectadas con puente (pantalla Crear y vista semanal).** Igual que (a) pero con una banda de relleno
del ~30% del ancho, centrada, que cruza el gap y une las dos cajas. En RN: una `View`
absoluta de 7px de alto en `top: -6` con el color de la superficie, y encima dos `View`
del color del fondo en los laterales con la esquina interior redondeada 5px — así el
relleno curva **hacia dentro**. Grupos con puente: Cuándo–Calendario–Invitar–Notificaciones, Vence–Notificaciones,
Temporalidad–Notificaciones (vertical, gap 5, banda 7×30%, radio 5) y la **vista semanal**
(horizontal, gap 6, banda de 6px que cruza todo el alto del gap, dos piezas del color de la
caja de 6×35% arriba y abajo con radio 5 que la recortan).

En RN, un solo componente reutilizable:

```tsx
<Bridge axis="vertical" | "horizontal" gap={5|6} surface={color.surface} behind={color.box} />
```

Se pinta como hijo absoluto del segundo elemento del par; el elemento NO debe llevar
`overflow: hidden` o el puente se recorta.

## 5. Pantallas

### Home (`Pantalla.dc.html`)
Cuatro estados de la caja superior, todos con el mismo control a la izquierda
(arriba HOY/SEM, abajo expandir/colapsar):

1. **Hoy colapsado** — caja de 200 px. `ScrollView` horizontal de franjas horarias,
   ~5 h visibles (`hourWidth = 62`), autoscroll a la hora actual. Eventos posicionados en
   absoluto; dos carriles (`top` 0 / 78) para solapes. Línea roja de "ahora".
2. **Semana colapsado** — 7 celdas (`#17171a`) conectadas en horizontal con el puente del
   punto 4b: gap 6, radios `17 6 6 17` / `6` / `6 17 17 6`, sin bordes; hoy con fondo teñido del acento;
   máximo 3 puntos por día y luego `+N`.
3. **Día expandido** — ocupa todo el alto. Scroll en los dos ejes: columna de días
   `position: sticky left` (en RN: dos `ScrollView` sincronizados o un
   `FlatList` horizontal dentro de uno vertical con cabecera fija).
4. **Mes expandido** — scroll vertical continuo entre meses (`FlatList` de meses,
   `getItemLayout` para saltar a hoy al montar).

Debajo (solo en modo colapsado), la caja de contenido con **cabeceras sticky**:
"TAREAS" y luego "HÁBITOS" se quedan pegadas al top del contenedor mientras el
contenido pasa por debajo → `SectionList` con `stickySectionHeadersEnabled`.

- **Tarea**: fila de 42 px, círculo de check de 20 px a la izquierda, meta a la derecha,
  icono de ajustes al final (abre la ficha del elemento; `stopPropagation`).
- **Hábito**: rejilla de 3 columnas, tarjeta de 84 px. Arriba a la izquierda tantos
  círculos como repeticiones (`target`); `onPress` +1, `onLongPress` (420 ms) −1;
  al llegar a `target` la tarjeta se tiñe del acento y el título se tacha.
  Tipos: `diario` / `semanal` (target 1) y `x-día` / `x-semana` (target N).
  Al superar `target` con otro press, vuelve a 0.
- **Botón CREAR**: barra de 54 px fija abajo, encima de la safe area.

**Drawer** (80% del ancho): nombre + versión, "Actualizar calendarios" con estado
momentáneo, una sección por cuenta con casilla por calendario (incluido el de Tareas),
"Otros calendarios" (CalDAV/ICS), y al pie Ajustes / Ayuda / Acerca de.

### Crear (`Crear.dc.html`)
Switch de 3 posiciones arriba (evento por defecto). El formulario cambia entero, pero el
bloque de título+descripción y el de notificaciones son comunes.
Evento: cuándo (+todo el día, +repetición), calendario, disponibilidad, visibilidad,
invitados. Tarea: vencimiento exacto u "mes aproximado". Hábito: temporalidad + contador.
Los avisos son `n minutos/horas/días antes`, salvo en hábitos, que son **horas del día**
(y días de la semana si es semanal). Los selectores de fecha/hora abren el picker nativo
(`@react-native-community/datetimepicker`) — no está diseñado en el prototipo.

### Ajustes, Ayuda, Acerca de
Listas de items separados (patrón 4a). Los selectores abren un **bottom sheet**
(`@gorhom/bottom-sheet`), no una pantalla nueva: día de inicio de semana, duración por
defecto, color de remarcado (6 círculos), calendario por defecto, formulario de comentario
y changelog. Los artículos de ayuda sí son navegación (`/help/[slug]`) y su contenido
debería venir de markdown remoto con caché local.

## 6. Reglas que no se pueden romper

- Nunca inundar de rojo: el acento es puntual (indicadores, completados, un CTA).
- Sin sombras: la elevación es un cambio de superficie (`#121214` → `#17171a`).
- Área táctil mínima 44 px aunque el elemento mida menos (usar `hitSlop`).
- Los iconos de ajustes por item no disparan la acción de la fila.
- Nada de blanco puro ni negro puro: el texto más claro es `#f0f0f2`, el fondo `#0a0a0b`.

## 7. Mapa data-rn del prototipo

`HomeHeader.MenuButton`, `SideDrawer`, `CalendarBox.ModeToggle`, `TodayTimeline`,
`WeekStrip` / `WeekStrip.DayCell`, `TaskRow`, `HabitCard`, `CreateFab`.
Cada uno lleva un `data-rn-note` con gesto, duración y estado esperado.
