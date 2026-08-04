/**
 * D-Calendar tokens, copied from the handoff (§2).
 *
 * No component writes a colour, a radius, a duration or an opacity by hand: it
 * all comes from here. The only exception is font sizes, which are written
 * literally in each component because the handoff specifies them element by
 * element; the global type adjustment is `TYPE_SCALE`.
 *
 * The accent does not live here either: it is a preference, read with
 * `useAccent()`.
 */

/**
 * Semantic palette. Several names share the same hex on purpose: the name
 * describes what it is for, not which shade it is, so a design change is
 * applied to the token that needs it and not to every one that happens to match
 * today.
 */
export const color = {
  background: '#0a0a0b',
  box: '#101012',
  surface: '#121214',
  card: '#141417',
  cardHover: '#17171a',
  cardPressed: '#1c1c20',
  cell: '#131316',
  sunken: '#0e0e10',
  sunkenHover: '#131315',
  control: '#1b1b1f',
  controlPressed: '#1d1d21',
  hairline: '#161619',
  scrim: '#000000',

  line: '#1c1c21',
  lineSoft: '#17171b',
  border: '#26262c',
  borderBox: '#1f1f24',
  borderStrong: '#2a2a30',
  borderCell: '#1b1b20',
  edge: '#2f2f36',
  outline: '#3a3a42',

  text: '#f0f0f2',
  textBody: '#e9e9ec',
  textSoft: '#dcdce1',
  textStrong: '#c9c9d0',
  textNote: '#b9b9c1',
  textNeutral: '#9a9aa2',
  textMuted: '#8a8a93',
  textSubtle: '#7d7d85',
  textQuiet: '#6b6b73',
  textDim: '#5f5f67',
  textDisabled: '#5c5c65',
  label: '#6e6e76',
  labelDim: '#55555d',
  faint: '#4d4d55',
  ghost: '#45454d',

  icon: '#5a5a62',
  iconFaint: '#4a4a52',
  caret: '#3f3f47',
  knobOff: '#5c5c65',

  accentDefault: '#e5252f',
} as const;

/**
 * Closed accent palette (Settings › Apariencia).
 *
 * The field is called `hex` and not `value` on purpose: the Reanimated Babel
 * plugin warns about any `something.value` inside an inline style because it
 * believes it is a shared value.
 */
export const ACCENTS = [
  { name: 'Rojo', hex: '#e5252f' },
  { name: 'Ámbar', hex: '#e5a020' },
  { name: 'Verde', hex: '#3fae6b' },
  { name: 'Azul', hex: '#3d7fe0' },
  { name: 'Violeta', hex: '#9184d9' },
  { name: 'Gris', hex: '#b9b9c1' },
] as const;

/**
 * Global type scale. The handoff sizes are written as they are in each
 * component and `<AppText>` / `<Label>` / `<Field>` multiply them by this, so
 * the design proportions are preserved.
 *
 * 1 = exactly the prototype.
 */
export const TYPE_SCALE: number = 1.1;

export const radius = {
  sheet: 28,
  box: 26,
  logo: 22,
  cta: 20,
  card: 18,
  pill: 16,
  segment: 15,
  event: 14,
  control: 13,
  chip: 12,
  tap: 10,
  joined: 9,
  check: 6,
} as const;

export const space = {
  screen: 12,
  box: 16,
  row: 10,
  gap: 5,
} as const;

/** Measurements repeated across several screens. */
export const size = {
  /** Minimum touch area from handoff §6. */
  touch: 44,
  /** Bottom action bar. */
  cta: 54,
  /** Screen header. */
  header: 38,
  /** Control in a form row. */
  control: 38,
  controlSmall: 36,
} as const;

/** A single set of durations (handoff §3). Do not invent others. */
export const duration = {
  /** Hover, pressed and colour changes. */
  press: 180,
  /** Check, switch and completed card. */
  state: 220,
  /** Habit strike-through. */
  strike: 300,
  /** Side menu and bottom sheets. */
  panel: 320,
  /** Overlay opacity. */
  overlay: 280,
  /** Pulse on completing a habit. */
  pulse: 320,
} as const;

/** cubic-bezier(.2,.8,.2,1) from the handoff. */
export const EASE_OUT = [0.2, 0.8, 0.2, 1] as const;

/** Opacity of the black veil covering the screen under a panel. */
export const OVERLAY_OPACITY = 0.55;

/**
 * Stacking order of the layers that overlap on a screen.
 *
 * `zIndex` only orders siblings, but Android leaves out of the view tree any
 * `View` carrying layout props alone, so a raised child ends up competing
 * against its parent's siblings. Anything that lifts itself over the rest of the
 * screen takes its value from here, so the comparison holds whichever level it
 * is flattened into.
 */
export const layer = {
  /** Screen header, over the box that follows it. */
  header: 2,
  /** Side menu and bottom sheets, together with their overlay. */
  panel: 30,
  /** Toasts, over the panels as well. */
  toast: 40,
} as const;

/**
 * Accent tint levels. Handoff §6 does not allow the accent as a solid fill: it
 * always goes tinted over the surface.
 */
export const tint = {
  /** Fill of a CTA or a completed card. */
  fill: 0.07,
  /** The same fill while being pressed. */
  fillPressed: 0.14,
  /** Selected chip. */
  chip: 0.09,
  /** Round confirmation icon. */
  glyph: 0.1,
  /** Today's cell in the month grid. */
  cell: 0.08,
  /** Delete row while pressed. */
  danger: 0.08,
  /** Selected day in the date picker. */
  selected: 0.16,
  /** Today's cell in the collapsed week. */
  today: 0.14,
  todayPressed: 0.2,
  /** Track of a switch that is on. */
  track: 0.22,
} as const;

/**
 * Turns a theme colour into `rgba()` with the requested opacity.
 *
 * Precondition: `hex` is a six digit colour with a leading `#` and `opacity` is
 * between 0 and 1. Postcondition: returns an `rgba()` string with the same RGB
 * channels.
 *
 * @param hex Source colour, for example `#e5252f`.
 * @param opacity Final opacity, normally a value from `tint`.
 */
export function alpha(hex: string, opacity: number) {
  const channels = parseInt(hex.slice(1), 16);
  const red = (channels >> 16) & 255;
  const green = (channels >> 8) & 255;
  const blue = channels & 255;
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

/**
 * Spreads the margin an element is missing to reach the minimum touch area from
 * handoff §6.
 *
 * Precondition: `elementSize` is the visible side of the element in px.
 * Postcondition: returns the `hitSlop` completing `size.touch`; every side is 0
 * or greater, so it never shrinks the real area.
 *
 * @param elementSize Visible side of the pressable element.
 */
export function hitSlopFor(elementSize: number) {
  const padding = Math.max(0, Math.round((size.touch - elementSize) / 2));
  return { top: padding, bottom: padding, left: padding, right: padding };
}
