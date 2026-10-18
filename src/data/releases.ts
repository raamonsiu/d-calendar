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

export const APP_VERSION = '1.3.0-alpha';
export const APP_BUILD = '8';

/** Every release up to 1.1.1 came out in the same month. */
const AUGUST_2026: Record<Language, string> = {
  es: 'AGOSTO 2026',
  en: 'AUGUST 2026',
  ca: 'AGOST 2026',
};

const SEPTEMBER_2026: Record<Language, string> = {
  es: 'SEPTIEMBRE 2026',
  en: 'SEPTEMBER 2026',
  ca: 'SETEMBRE 2026',
};

const OCTOBER_2026: Record<Language, string> = {
  es: 'OCTUBRE 2026',
  en: 'OCTOBER 2026',
  ca: 'OCTUBRE 2026',
};

/** Newest first: that is the order they are drawn in. */
export const RELEASES: Release[] = [
  {
    version: '1.3.0-alpha',
    date: OCTOBER_2026,
    notes: {
      es: [
        'Nuevo selector Día / Semana / Mes arriba a la izquierda del calendario, en lugar de los dos botones de la columna. La app recuerda la última vista que elegiste.',
        'Junto al selector, un botón «Hoy» te devuelve al día de hoy en la vista de día, estés donde estés. Cuando ya estás en hoy se apaga, para que se vea que no hay a dónde ir.',
        'El día se lee ahora de arriba abajo, de 00 a 23 y sin pasarse de ninguno de los dos extremos; deslizando a los lados pasas de un día al siguiente. Arriba aparece su nombre completo, y la franja de «todo el día» solo ocupa sitio cuando ese día tiene algo.',
        'Un día con muchos eventos de todo el día enseña hasta tres; si hay más, dos y un botón «+N más» que abre la lista entera en una ventana, desde donde abres cualquiera.',
        'Los eventos cortos, de menos de 45 minutos, ponen la hora y el título en la misma línea para que el título ya no salga cortado.',
        'La semana se desplaza de arriba abajo y enseña dos semanas a la vez. Tocar un día lo abre en la vista de día.',
        'En el mes, los puntos de los días con «+N» quedan a la misma altura que los de los días sin él.',
        'El calendario es más alto: ocupa como mínimo el 40% de la pantalla y crece hasta el 70% cuando tienes pocas tareas y hábitos.',
        'Desaparece el botón de expandir: el calendario ya se hace sitio solo.',
        'En el menú lateral, la marca de los calendarios activos va en oscuro sobre el color, en lugar de en blanco.',
      ],
      en: [
        'New Day / Week / Month selector at the top left of the calendar, instead of the two buttons in the column. The app remembers the last view you picked.',
        'Next to the selector, a "Today" button takes you back to today in the day view, wherever you are. When you are already on today it dims, so it is clear there is nowhere to go.',
        "The day now reads top to bottom, from 00 to 23 without going past either end; swiping sideways moves from one day to the next. Its full name is shown on top, and the all-day band only takes room when that day has something in it.",
        'A day with many all-day events shows up to three; past that, two and a "+N more" button that opens the whole list in a window, where any of them can be opened.',
        'Short events, under 45 minutes, put their time and title on the same line, so the title is no longer cut off.',
        'The week scrolls top to bottom and shows two weeks at a time. Tapping a day opens it in the day view.',
        'In the month, the dots of days with a "+N" sit at the same height as those of days without one.',
        'The calendar is taller: it takes at least 40% of the screen and grows up to 70% when you have few tasks and habits.',
        'The expand button is gone: the calendar now makes room for itself.',
        'In the side menu, the tick of the calendars that are on is dark on the colour instead of white.',
      ],
      ca: [
        'Nou selector Dia / Setmana / Mes a dalt a l’esquerra del calendari, en lloc dels dos botons de la columna. L’app recorda l’última vista que vas triar.',
        'Al costat del selector, un botó «Avui» et torna al dia d’avui a la vista de dia, siguis on siguis. Quan ja ets a avui s’apaga, perquè es vegi que no hi ha on anar.',
        'El dia es llegeix ara de dalt a baix, de 00 a 23 i sense passar-se de cap dels dos extrems; lliscant als costats passes d’un dia al següent. A dalt hi surt el seu nom complet, i la franja de «tot el dia» només ocupa lloc quan aquell dia hi té alguna cosa.',
        'Un dia amb molts esdeveniments de tot el dia en mostra fins a tres; si n’hi ha més, dos i un botó «+N més» que obre la llista sencera en una finestra, des d’on pots obrir-ne qualsevol.',
        'Els esdeveniments curts, de menys de 45 minuts, posen l’hora i el títol a la mateixa línia perquè el títol ja no surti tallat.',
        'La setmana es desplaça de dalt a baix i mostra dues setmanes alhora. Tocar un dia l’obre a la vista de dia.',
        'Al mes, els punts dels dies amb «+N» queden a la mateixa alçada que els dels dies sense.',
        'El calendari és més alt: ocupa com a mínim el 40% de la pantalla i creix fins al 70% quan tens poques tasques i hàbits.',
        'Desapareix el botó d’expandir: el calendari ja es fa lloc sol.',
        'Al menú lateral, la marca dels calendaris actius va en fosc sobre el color, en lloc d’en blanc.',
      ],
    },
  },
  {
    version: '1.2.3-alpha',
    date: OCTOBER_2026,
    notes: {
      es: [
        'Un hábito semanal, de una o de varias veces por semana, solo se da por pendiente los dos últimos días de la semana: antes salía cada día en la pantalla de bienvenida aunque ya llevaras parte hecha o pensaras hacerlo otro día.',
        'Su recordatorio, si no le marcaste días, suena también solo esos dos últimos días, en lugar de cada día. Si le marcaste días, sigue sonando en los que elegiste.',
        'El último aviso semanal sigue saliendo el penúltimo o el último día, como elijas en Ajustes, y el diario no cuenta los hábitos semanales.',
      ],
      en: [
        "A weekly habit, once or several times a week, only counts as pending on the last two days of the week: it used to show up every day on the welcome screen even when you had already done part of it or meant to do it another day.",
        "Its reminder, if you didn't mark any days, also fires only on those last two days instead of every day. If you marked days, it keeps firing on the ones you chose.",
        'The weekly last chance summary still comes on the second to last or the last day, as you pick in Settings, and the daily one leaves weekly habits out.',
      ],
      ca: [
        'Un hàbit setmanal, d’una o de diverses vegades per setmana, només es dona per pendent els dos últims dies de la setmana: abans sortia cada dia a la pantalla de benvinguda encara que ja en portessis una part feta o pensessis fer-lo un altre dia.',
        'El seu recordatori, si no li vas marcar dies, també sona només aquests dos últims dies, en lloc de cada dia. Si li vas marcar dies, continua sonant els que vas triar.',
        'L’últim avís setmanal continua sortint el penúltim o l’últim dia, com triïs a Ajustos, i el diari no compta els hàbits setmanals.',
      ],
    },
  },
  {
    version: '1.2.2-alpha',
    date: SEPTEMBER_2026,
    notes: {
      es: [
        'Un evento que se repite ya se ve en todos los días en que se repite, y no solo el día en que lo creaste: antes el aviso sonaba y el día salía vacío.',
        'Un evento que pasa de medianoche aparece en los dos días, con las horas que ocupa en cada uno.',
        'Un evento de varios días, un viaje o unas vacaciones, aparece en todos sus días y no solo en el primero.',
        'Los puntos de la semana y del mes, y el número de eventos de la cabecera, cuentan ahora cada día tal y como es.',
        'La pantalla de bienvenida cuenta también lo que empezó ayer y todavía está en marcha.',
      ],
      en: [
        'A repeating event now shows on every day it repeats on, and not only on the day you created it: the reminder used to fire while the day looked empty.',
        'An event that runs past midnight shows on both days, with the hours it takes on each.',
        'An event of several days, a trip or a holiday, shows on all of them and not only on the first.',
        'The dots on the week and the month, and the event count in the header, now count every day as it really is.',
        'The welcome screen also counts what started yesterday and is still running.',
      ],
      ca: [
        'Un esdeveniment que es repeteix ja es veu tots els dies en què es repeteix, i no només el dia que el vas crear: abans l’avís sonava i el dia sortia buit.',
        'Un esdeveniment que passa de mitjanit apareix els dos dies, amb les hores que ocupa a cadascun.',
        'Un esdeveniment de diversos dies, un viatge o unes vacances, apareix tots els dies i no només el primer.',
        'Els punts de la setmana i del mes, i el nombre d’esdeveniments de la capçalera, ara compten cada dia tal com és.',
        'La pantalla de benvinguda compta també el que va començar ahir i encara està en marxa.',
      ],
    },
  },
  {
    version: '1.2.1-alpha',
    date: SEPTEMBER_2026,
    notes: {
      es: [
        'Pantalla de bienvenida al abrir la app: un saludo según la hora y lo que te queda hoy en eventos, tareas y hábitos.',
        'Se va sola a los pocos segundos, o antes si deslizas hacia arriba.',
        'Nuevo ajuste «Pantalla de bienvenida», en Ajustes, para elegir cuántos segundos dura, de 0 a 10; con 0 no se muestra.',
        'El arranque ya no parpadea: la app abre directamente en esa pantalla, sin la pantalla de carga con el icono.',
        'Nuevo «Último aviso», en Ajustes › Notificaciones: un resumen diario, y otro semanal, de lo que quede pendiente, a la hora que elijas.',
      ],
      en: [
        'A welcome screen when you open the app: a greeting for the time of day, and what you have left today in events, tasks and habits.',
        'It leaves by itself after a few seconds, or sooner if you swipe up.',
        'A new "Welcome screen" setting, in Settings, chooses how many seconds it stays, from 0 to 10; at 0 it never shows.',
        'Opening the app no longer flashes: it starts on that screen, with no loading screen showing the icon.',
        'A new "Last chance" group, in Settings › Notifications: a daily summary, and a weekly one, of whatever is still pending, at the time you choose.',
      ],
      ca: [
        'Pantalla de benvinguda en obrir l’app: una salutació segons l’hora i el que et queda avui en esdeveniments, tasques i hàbits.',
        'Se’n va sola al cap de pocs segons, o abans si llisques amunt.',
        'Nou ajust «Pantalla de benvinguda», a Configuració, per triar quants segons dura, de 0 a 10; amb 0 no es mostra.',
        'L’arrencada ja no parpelleja: l’app obre directament en aquesta pantalla, sense la pantalla de càrrega amb la icona.',
        'Nou «Últim avís», a Configuració › Notificacions: un resum diari, i un de setmanal, del que quedi pendent, a l’hora que triïs.',
      ],
    },
  },
  {
    version: '1.1.1-alpha',
    date: AUGUST_2026,
    notes: {
      es: [
        'El texto secundario y los iconos se leen mejor: se ha subido el contraste de los tonos que no llegaban al estándar de accesibilidad.',
        'Nuevo ajuste «Más contraste», en Ajustes › Accesibilidad, para subirlo todavía más sin cambiar el resto del diseño.',
        'Los iconos y las flechas cumplen el contraste mínimo siempre, con el ajuste puesto o no.',
      ],
      en: [
        'Secondary text and icons are easier to read: the tones that fell short of the accessibility standard have been raised.',
        'A new "More contrast" setting, in Settings › Accessibility, lifts them further without changing the rest of the design.',
        'Icons and carets now meet the minimum contrast at all times, with the setting on or off.',
      ],
      ca: [
        'El text secundari i les icones es llegeixen millor: s’ha apujat el contrast dels tons que no arribaven a l’estàndard d’accessibilitat.',
        'Nou ajust «Més contrast», a Configuració › Accessibilitat, per apujar-lo encara més sense canviar la resta del disseny.',
        'Les icones i les fletxes compleixen el contrast mínim sempre, amb l’ajust activat o no.',
      ],
    },
  },
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
