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

  /**
   * The four tones icons and controls are drawn in.
   *
   * They sit higher than the greys of the same rank in the text scale, and
   * deliberately: WCAG asks 3:1 of anything that is not text but still has to
   * be seen, and at the values the prototype used - a caret at 1.76:1 - a
   * control could be missed altogether. Unlike the text tones these are not
   * behind the "Más contraste" setting: a caret nobody can find is a defect,
   * not a preference.
   */
  icon: '#6a6a72',
  iconFaint: '#63636b',
  caret: '#63636b',
  knobOff: '#6c6c75',

  /**
   * The app's own purple, from the icon's inner circle (`icon-source/icon.svg`):
   * the icon's background purple (`#4E1F6E`) reads at ~1.6:1 against this
   * background as text or an icon, effectively invisible, while this lighter
   * tone reads at ~9.5:1.
   */
  accentDefault: '#c4a8e0',
} as const;

/**
 * Closed accent palette (Settings › Apariencia).
 *
 * The colour carries a translation key and not a name, because the name is
 * copy and copy does not live in the tokens: the swatch is read out by its
 * label, so it has to follow the language like everything else.
 *
 * The field is called `hex` and not `value` on purpose: the Reanimated Babel
 * plugin warns about any `something.value` inside an inline style because it
 * believes it is a shared value.
 */
export const ACCENTS = [
  { labelKey: 'common.accentRed', hex: '#e5252f' },
  { labelKey: 'common.accentAmber', hex: '#e5a020' },
  { labelKey: 'common.accentGreen', hex: '#3fae6b' },
  { labelKey: 'common.accentBlue', hex: '#3d7fe0' },
  { labelKey: 'common.accentViolet', hex: '#c4a8e0' },
  { labelKey: 'common.accentGrey', hex: '#b9b9c1' },
] as const;

/**
 * Brighter stand-in for each text colour that does not reach WCAG AA, used
 * when "Más contraste" is on in Settings › Accesibilidad.
 *
 * Measured against `card`, the lightest surface text sits on and therefore
 * the worst case. Seven of the dim greys fall under 4.5:1 there, and two of
 * them under 3:1; the design leans on them for labels and hints at 8.5-10px,
 * where the large-text exemption does not apply.
 *
 * Raising each one to the bare 4.5:1 would land them all on the same grey and
 * flatten the hierarchy into a single tone, so they are lifted onto three
 * levels of the palette instead, keeping their order: what was dimmest is
 * still dimmest. `textDisabled` is deliberately the lowest of the three,
 * because on a completed task its dimness is what says "done".
 */
export const CONTRAST_LIFT: Record<string, string> = {
  [color.ghost]: color.textMuted,
  [color.faint]: color.textMuted,
  [color.labelDim]: color.textMuted,
  [color.textDim]: color.textMuted,
  [color.textQuiet]: color.textMuted,
  [color.textSubtle]: color.textMuted,
  [color.textDisabled]: color.textSubtle,
  [color.label]: color.textNeutral,
};

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
 * against its parent's siblings. Anything that lifts itself over the rest of
 * the screen takes its value from here, so the comparison holds whichever level
 * it is flattened into.
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
 * The same tint as `alpha`, flattened against the surface it sits on.
 *
 * The home screen widget cannot use `alpha`: Android parses the colours of a
 * widget itself and takes no `rgba()` string, so a translucent fill has to be
 * worked out here and handed over solid.
 *
 * Precondition: both colours are six digit with a leading `#`, and `opacity`
 * is between 0 and 1. Postcondition: returns a six digit colour that looks
 * exactly like `top` at that opacity over `bottom`.
 *
 * @param top Colour being laid on, normally the accent.
 * @param bottom Colour underneath, normally a surface.
 * @param opacity Final opacity of `top`, normally a value from `tint`.
 */
export function blend(
  top: string,
  bottom: string,
  opacity: number,
): `#${string}` {
  const channelsOf = (hex: string) => {
    const value = parseInt(hex.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  };

  const [topRed, topGreen, topBlue] = channelsOf(top);
  const [bottomRed, bottomGreen, bottomBlue] = channelsOf(bottom);

  const mix = (over: number, under: number) =>
    Math.round(over * opacity + under * (1 - opacity));

  const mixed =
    (mix(topRed, bottomRed) << 16) |
    (mix(topGreen, bottomGreen) << 8) |
    mix(topBlue, bottomBlue);

  return `#${mixed.toString(16).padStart(6, '0')}`;
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
