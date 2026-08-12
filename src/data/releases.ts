/**
 * App version and release notes, which is what About and the changelog sheet
 * show. It is also where the side menu reads the version from.
 *
 * Versioned 0.1 to 1.0 rather than continuing whatever came before: the app
 * has no public release yet, so 1.0 is the one this history is building
 * towards — the version meant to actually reach a store.
 */

export type Release = { version: string; date: string; notes: string[] };

export const APP_VERSION = '1.0';
export const APP_BUILD = '1';

/** Newest first: that is the order they are drawn in. */
export const RELEASES: Release[] = [
  {
    version: '1.0',
    date: 'AGOSTO 2026',
    notes: [
      'Sincronización con los calendarios del teléfono, con el icono del menú lateral girando mientras se actualiza.',
      'Edición de eventos que se repiten, incluidos sus invitados, también al guardar cambios y no solo al crearlos.',
      'El día entero visible sin que los eventos sin hora tapen los que sí la tienen.',
      'Corregido el bloqueo que impedía editar algunos eventos que sí eran del usuario.',
      'Avisos a la hora exacta en Android, en vez de sueltos por ahorro de batería.',
      'Guardar cambios solo aparece cuando algo cambia de verdad; al crear sigue como antes.',
      'Ayuda, política de privacidad, términos de uso y licencias de código abierto.',
    ],
  },
  {
    version: '0.3',
    date: 'AGOSTO 2026',
    notes: [
      'Vista de mes con desplazamiento continuo.',
      'Comparación de las vistas de día y de año, más fiable.',
    ],
  },
  {
    version: '0.2',
    date: 'AGOSTO 2026',
    notes: [
      'Recordatorios reales, con notificaciones locales del propio teléfono.',
      'Lo que se crea en la app se guarda en el dispositivo.',
      'Calendarios del teléfono y calendarios por suscripción .ics.',
    ],
  },
  {
    version: '0.1',
    date: 'AGOSTO 2026',
    notes: [
      'Primeras pantallas: inicio, crear y ajustes, con datos de ejemplo.',
      'Base de diseño: tokens, tipografía y preferencias.',
    ],
  },
];
