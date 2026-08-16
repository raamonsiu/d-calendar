/**
 * App version and release notes, which is what About and the changelog sheet
 * show. It is also where the side menu reads the version from.
 *
 * Versioned 0.1 to 1.0 rather than continuing whatever came before: the app
 * has no public release yet, so 1.0 is the one this history is building
 * towards: the version meant to actually reach a store.
 */
import type { Language } from '@/lib/language';

export type Release = {
  version: string;
  /** Month and year the version came out, already uppercased for the row. */
  date: Record<Language, string>;
  notes: Record<Language, string[]>;
};

export const APP_VERSION = '1.1.0-alpha';
export const APP_BUILD = '3';

/** Every release so far came out in the same month. */
const AUGUST_2026: Record<Language, string> = {
  es: 'AGOSTO 2026',
  en: 'AUGUST 2026',
  ca: 'AGOST 2026',
};

/** Newest first: that is the order they are drawn in. */
export const RELEASES: Release[] = [
  {
    version: '1.1.0-alpha',
    date: AUGUST_2026,
    notes: {
      es: [
        'Widget de pantalla de inicio: elige un hábito al añadirlo y tócalo para sumar una repetición sin abrir la app.',
        'El widget sigue el color de remarcado, se tacha al completar el periodo y vuelve a cero cuando el día o la semana terminan.',
        'Mantén pulsado el widget para cambiar de hábito.',
      ],
      en: [
        'Home screen widget: pick a habit when you add it, and tap it to count one more without opening the app.',
        'The widget follows the accent colour, crosses itself out when the period is complete, and starts over when the day or the week ends.',
        'Hold the widget to change which habit it follows.',
      ],
      ca: [
        'Widget de pantalla d’inici: tria un hàbit en afegir-lo i toca’l per sumar una repetició sense obrir l’app.',
        'El widget segueix el color de remarcat, es ratlla en completar el període i torna a zero quan el dia o la setmana s’acaben.',
        'Mantén premut el widget per canviar d’hàbit.',
      ],
    },
  },
  {
    version: '1.0.1-alpha',
    date: AUGUST_2026,
    notes: {
      es: [
        'Un hábito vuelve a empezar cuando su día o su semana termina, en vez de quedarse marcado para siempre.',
        'La racha se conserva solo si el periodo anterior se completó: dejarlo a medias o saltarse un día la rompe.',
        'Las tareas completadas ahora sí desaparecen al día siguiente, también las que venías arrastrando de la versión anterior.',
        'Los títulos largos de una tarea se leen enteros, en dos líneas.',
        'Los avisos se ajustan mejor: los minutos van de cinco en cinco, y las horas y los días empiezan en uno.',
      ],
      en: [
        'A habit starts over when its day or week is done, instead of staying ticked for ever.',
        'The streak only survives when the previous period was completed: leaving it half way or skipping a day breaks it.',
        'Completed tasks really do disappear the next day now, the ones carried over from the previous version included.',
        'Long task titles can be read in full, on two lines.',
        'Reminders fit better: minutes move in fives, and hours and days start at one.',
      ],
      ca: [
        'Un hàbit torna a començar quan el seu dia o la seva setmana s’acaba, en comptes de quedar-se marcat per sempre.',
        'La ratxa es conserva només si el període anterior es va completar: deixar-lo a mitges o saltar-se un dia la trenca.',
        'Les tasques completades ara sí que desapareixen l’endemà, també les que arrossegaves de la versió anterior.',
        'Els títols llargs d’una tasca es llegeixen sencers, en dues línies.',
        'Els avisos s’ajusten millor: els minuts van de cinc en cinc, i les hores i els dies comencen a un.',
      ],
    },
  },
  {
    version: '1.0',
    date: AUGUST_2026,
    notes: {
      es: [
        'Sincronización con los calendarios del teléfono, con el icono del menú lateral girando mientras se actualiza.',
        'Edición de eventos que se repiten, incluidos sus invitados, también al guardar cambios y no solo al crearlos.',
        'El día entero visible sin que los eventos sin hora tapen los que sí la tienen.',
        'Corregido el bloqueo que impedía editar algunos eventos que sí eran del usuario.',
        'Avisos a la hora exacta en Android, en vez de sueltos por ahorro de batería.',
        'Guardar cambios solo aparece cuando algo cambia de verdad; al crear sigue como antes.',
        'Ayuda, política de privacidad, términos de uso y licencias de código abierto.',
        'La app habla español, inglés y catalán, y elige el idioma del teléfono al empezar.',
        'Presentación al primer arranque, con los permisos explicados antes de pedirlos.',
        'Las tareas completadas se eliminan al día siguiente de marcarlas.',
      ],
      en: [
        'Syncing with the calendars of the phone, with the side menu icon turning while it updates.',
        'Editing events that repeat, guests included, when saving changes and not only when creating them.',
        'The whole day visible without the events with no time covering the ones that have it.',
        'Fixed the block that stopped some events that were the user’s own from being edited.',
        'Reminders at the exact time on Android, instead of loose ones to save battery.',
        'Save changes only appears when something really changed; creating works as before.',
        'Help, privacy policy, terms of use and open source licences.',
        'The app speaks Spanish, English and Catalan, and picks the phone’s language to start with.',
        'A walkthrough on first launch, with the permissions explained before they are asked for.',
        'Completed tasks are removed the day after they are checked off.',
      ],
      ca: [
        'Sincronització amb els calendaris del telèfon, amb la icona del menú lateral girant mentre s’actualitza.',
        'Edició d’esdeveniments que es repeteixen, convidats inclosos, també en desar canvis i no només en crear-los.',
        'El dia sencer visible sense que els esdeveniments sense hora tapin els que sí que en tenen.',
        'Corregit el bloqueig que impedia editar alguns esdeveniments que sí que eren de l’usuari.',
        'Avisos a l’hora exacta a Android, en comptes de solts per estalvi de bateria.',
        'Desa els canvis només apareix quan alguna cosa canvia de debò; en crear funciona com abans.',
        'Ajuda, política de privadesa, termes d’ús i llicències de codi obert.',
        'L’app parla castellà, anglès i català, i tria l’idioma del telèfon en començar.',
        'Presentació en el primer arrencada, amb els permisos explicats abans de demanar-los.',
        'Les tasques completades s’eliminen l’endemà de marcar-les.',
      ],
    },
  },
  {
    version: '0.3',
    date: AUGUST_2026,
    notes: {
      es: [
        'Vista de mes con desplazamiento continuo.',
        'Comparación de las vistas de día y de año, más fiable.',
      ],
      en: [
        'Month view with continuous scrolling.',
        'Comparing the day and year views, more reliable now.',
      ],
      ca: [
        'Vista de mes amb desplaçament continu.',
        'Comparació de les vistes de dia i d’any, més fiable.',
      ],
    },
  },
  {
    version: '0.2',
    date: AUGUST_2026,
    notes: {
      es: [
        'Recordatorios reales, con notificaciones locales del propio teléfono.',
        'Lo que se crea en la app se guarda en el dispositivo.',
        'Calendarios del teléfono y calendarios por suscripción .ics.',
      ],
      en: [
        'Real reminders, as local notifications of the phone itself.',
        'What is created in the app is stored on the device.',
        'Calendars of the phone and calendars subscribed to by .ics.',
      ],
      ca: [
        'Recordatoris reals, amb notificacions locals del mateix telèfon.',
        'El que es crea a l’app es desa al dispositiu.',
        'Calendaris del telèfon i calendaris per subscripció .ics.',
      ],
    },
  },
  {
    version: '0.1',
    date: AUGUST_2026,
    notes: {
      es: [
        'Primeras pantallas: inicio, crear y ajustes, con datos de ejemplo.',
        'Base de diseño: tokens, tipografía y preferencias.',
      ],
      en: [
        'First screens: home, create and settings, with sample data.',
        'Design groundwork: tokens, typography and preferences.',
      ],
      ca: [
        'Primeres pantalles: inici, crear i configuració, amb dades d’exemple.',
        'Base de disseny: tokens, tipografia i preferències.',
      ],
    },
  },
];
