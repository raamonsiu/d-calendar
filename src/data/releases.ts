/**
 * App version and release notes, which is what About and the changelog sheet
 * show. It is also where the side menu reads the version from.
 */

export type Release = { version: string; date: string; notes: string[] };

export const APP_VERSION = '1.4';
export const APP_BUILD = '240';

/** Newest first: that is the order they are drawn in. */
export const RELEASES: Release[] = [
  {
    version: '1.4',
    date: 'JULIO 2026',
    notes: [
      'Hábitos de varias veces al día y a la semana, con marcadores en la tarjeta.',
      'Menú lateral con sincronización por calendario.',
      'Vista de mes con desplazamiento continuo.',
    ],
  },
  {
    version: '1.3',
    date: 'MAYO 2026',
    notes: [
      'Vista de día expandida con cuatro días en pantalla.',
      'Recordatorios múltiples por evento.',
    ],
  },
  {
    version: '1.2',
    date: 'MARZO 2026',
    notes: ['Soporte de calendarios iCloud y suscripciones .ics.'],
  },
];
