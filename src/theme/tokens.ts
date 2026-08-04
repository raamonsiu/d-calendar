/**
 * Tokens de D-Calendar. Copiados literalmente del handoff (§2).
 * El acento NO vive aquí: es una preferencia, se lee con useAccent().
 */

export const color = {
  bg: '#0a0a0b', // fondo de pantalla
  box: '#101012', // caja grande (home)
  surface: '#121214', // superficie de item / caja conectada
  card: '#141417', // tarjeta, input, control
  cardHover: '#17171a', // estado pressed de una fila
  line: '#1c1c21', // separador 1px
  border: '#26262c', // borde de control
  borderMut: '#1f1f24', // borde de caja
  borderStrong: '#2a2a30', // borde de control interactivo
  text: '#f0f0f2',
  textSoft: '#dcdce1',
  textBody: '#e9e9ec',
  textMuted: '#8a8a93',
  label: '#6e6e76', // micro-etiqueta
  labelDim: '#55555d',
  faint: '#4d4d55',
  ghost: '#45454d',
  hairline: '#161619',
  accentDefault: '#e5252f',
} as const;

/**
 * Paleta cerrada de acentos (Ajustes › Apariencia).
 * El campo se llama `hex` y no `value` a propósito: el plugin de Babel de
 * Reanimated avisa de cualquier `algo.value` dentro de un style inline porque
 * cree que es un shared value.
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
 * Escala global de tipografía. Los tamaños del handoff se escriben tal cual en
 * cada componente y `<T>` / `<Label>` / `<Field>` los multiplican por esto, así
 * que las proporciones del diseño se mantienen. 1 = exactamente el prototipo.
 */
export const TYPE_SCALE: number = 1.1;

export const radius = {
  box: 26,
  card: 18,
  control: 13,
  chip: 12,
  joined: 9,
} as const;

export const space = {
  screen: 12,
  box: 16,
  row: 10,
  gap: 5,
} as const;

/** Un solo set de duraciones (handoff §3). No inventar otras. */
export const duration = {
  press: 180, // hover / pressed / cambio de color
  state: 220, // check, switch, tarjeta completada
  strike: 300, // tachado del hábito
  panel: 320, // drawer y bottom sheets
  overlay: 280, // opacidad del overlay
  pulse: 320, // pulso al completar hábito
} as const;

/** cubic-bezier(.2,.8,.2,1) del handoff. */
export const EASE_OUT = [0.2, 0.8, 0.2, 1] as const;

/** Alpha helper: el acento se usa teñido en fondos. */
export const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

/** Área táctil mínima 44px aunque el elemento mida menos (handoff §6). */
export const hitSlopFor = (size: number) => {
  const pad = Math.max(0, Math.round((44 - size) / 2));
  return { top: pad, bottom: pad, left: pad, right: pad };
};
