import type { Language } from '@/lib/language';
import {
  ArrowsClockwiseIcon,
  BellIcon,
  DownloadSimpleIcon,
  DropHalfIcon,
  ListChecksIcon,
  LockSimpleIcon,
  PencilSimpleIcon,
  PlusIcon,
  RepeatIcon,
  TrashIcon,
  UserPlusIcon,
  type Icon,
} from '@/ui/icons';

/**
 * Content of the help articles.
 *
 * The handoff plans to fetch this from remote markdown with a local cache; for
 * now it lives here, same as in the prototype. The screen only knows how to
 * draw the four block types, so adding an article means adding data.
 *
 * The `slug` is the one field that does not follow the language: it is the
 * last segment of the URL, so translating it would break every link already
 * out there and change the address depending on who is reading. Everything
 * the reader actually sees is a `Record<Language, ...>`.
 */

/** The four block types the article knows how to draw. */
export type Block =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'step'; text: string }
  | { type: 'note'; text: string };

export type Topic = {
  /** Last segment of the URL: `/help/[slug]`. Never translated. */
  slug: string;
  title: Record<Language, string>;
  /** Micro label with the reading time and the category. */
  meta: Record<Language, string>;
  icon: Icon;
  blocks: Record<Language, Block[]>;
};

const paragraph = (text: string): Block => ({ type: 'p', text });
const heading = (text: string): Block => ({ type: 'h', text });
const step = (text: string): Block => ({ type: 'step', text });
const note = (text: string): Block => ({ type: 'note', text });

/**
 * The categories the `meta` label ends in, so a category is spelled the same
 * way in every article that belongs to it.
 */
const CATEGORY = {
  basics: { es: 'BÁSICOS', en: 'BASICS', ca: 'BÀSICS' },
  accounts: { es: 'CUENTAS', en: 'ACCOUNTS', ca: 'COMPTES' },
  habits: { es: 'HÁBITOS', en: 'HABITS', ca: 'HÀBITS' },
  reminders: { es: 'AVISOS', en: 'REMINDERS', ca: 'AVISOS' },
  appearance: { es: 'APARIENCIA', en: 'APPEARANCE', ca: 'APARENÇA' },
} as const;

/**
 * Builds the `meta` label of an article in the three languages.
 *
 * Postcondition: the minutes are the same in all three; only the category
 * name follows the language.
 *
 * @param minutes Reading time in minutes.
 * @param category Which of the five categories the article belongs to.
 */
function meta(
  minutes: number,
  category: keyof typeof CATEGORY,
): Record<Language, string> {
  const names = CATEGORY[category];
  return {
    es: `${minutes} MIN · ${names.es}`,
    en: `${minutes} MIN · ${names.en}`,
    ca: `${minutes} MIN · ${names.ca}`,
  };
}

export const TOPICS: Topic[] = [
  {
    slug: 'crear-un-elemento',
    title: {
      es: 'Cómo crear un evento, una tarea o un hábito',
      en: 'How to create an event, a task or a habit',
      ca: 'Com crear un esdeveniment, una tasca o un hàbit',
    },
    meta: meta(1, 'basics'),
    icon: PlusIcon,
    blocks: {
      es: [
        paragraph(
          'El botón CREAR de la pantalla principal abre un mismo formulario para los tres tipos: arriba eliges cuál con las pestañas Evento, Tarea o Hábito.',
        ),
        step('Escribe un título. El botón de crear se activa en cuanto hay uno.'),
        step(
          'Rellena lo propio de cada tipo: hora y calendario en un evento, fecha límite en una tarea, frecuencia y objetivo en un hábito.',
        ),
        step('Pulsa Crear evento, Crear tarea o Crear hábito.'),
        note(
          'Si el destino es un calendario del teléfono, el evento se escribe ahí directamente y lo verás también en Google Calendar o donde corresponda.',
        ),
      ],
      en: [
        paragraph(
          'The CREATE button on the main screen opens one same form for the three types: at the top you pick which one with the Event, Task or Habit tabs.',
        ),
        step('Write a title. The create button turns on as soon as there is one.'),
        step(
          'Fill in what belongs to each type: time and calendar on an event, due date on a task, frequency and target on a habit.',
        ),
        step('Press Create event, Create task or Create habit.'),
        note(
          'If the destination is a calendar of the phone, the event is written straight there and you will see it in Google Calendar too, or wherever it belongs.',
        ),
      ],
      ca: [
        paragraph(
          'El botó CREA de la pantalla principal obre un mateix formulari per als tres tipus: a dalt tries quin amb les pestanyes Esdeveniment, Tasca o Hàbit.',
        ),
        step('Escriu un títol. El botó de crear s’activa tan bon punt n’hi ha un.'),
        step(
          'Omple el que és propi de cada tipus: hora i calendari en un esdeveniment, data límit en una tasca, freqüència i objectiu en un hàbit.',
        ),
        step('Prem Crea esdeveniment, Crea tasca o Crea hàbit.'),
        note(
          'Si el destí és un calendari del telèfon, l’esdeveniment s’escriu allà directament i el veuràs també a Google Calendar o on correspongui.',
        ),
      ],
    },
  },
  {
    slug: 'editar-un-elemento',
    title: {
      es: 'Cómo editar un evento, una tarea o un hábito',
      en: 'How to edit an event, a task or a habit',
      ca: 'Com editar un esdeveniment, una tasca o un hàbit',
    },
    meta: meta(1, 'basics'),
    icon: PencilSimpleIcon,
    blocks: {
      es: [
        paragraph(
          'Toca el elemento desde la pantalla principal para abrir la misma ficha con la que se creó, ahora con sus datos rellenos.',
        ),
        step('Cambia lo que haga falta.'),
        step(
          'El botón Guardar cambios aparece solo cuando algo es distinto de como estaba: si abres una ficha y no tocas nada, no hay nada que guardar y el botón no sale.',
        ),
        note(
          'En un evento que no es tuyo - la invitación de otra persona, o un calendario al que solo estás suscrito - la ficha se ve pero no se puede tocar. Solo los avisos, que son de la app y no del evento, siguen siendo tuyos.',
        ),
      ],
      en: [
        paragraph(
          'Tap the item on the main screen to open the same form it was created with, now filled in.',
        ),
        step('Change whatever needs changing.'),
        step(
          'The Save changes button only appears when something is different from how it was: open a form and touch nothing, and there is nothing to save, so the button stays away.',
        ),
        note(
          'On an event that is not yours - somebody else’s invitation, or a calendar you are only subscribed to - the form can be read but not touched. Only the reminders, which belong to the app and not to the event, are still yours.',
        ),
      ],
      ca: [
        paragraph(
          'Toca l’element des de la pantalla principal per obrir la mateixa fitxa amb què es va crear, ara amb les dades emplenades.',
        ),
        step('Canvia el que calgui.'),
        step(
          'El botó Desa els canvis apareix només quan alguna cosa és diferent de com estava: si obres una fitxa i no toques res, no hi ha res a desar i el botó no surt.',
        ),
        note(
          'En un esdeveniment que no és teu - la invitació d’una altra persona, o un calendari al qual només estàs subscrit - la fitxa es veu però no es pot tocar. Només els avisos, que són de l’app i no de l’esdeveniment, continuen sent teus.',
        ),
      ],
    },
  },
  {
    slug: 'eventos-que-se-repiten',
    title: {
      es: 'Editar o eliminar un evento que se repite',
      en: 'Editing or deleting an event that repeats',
      ca: 'Editar o eliminar un esdeveniment que es repeteix',
    },
    meta: meta(2, 'basics'),
    icon: RepeatIcon,
    blocks: {
      es: [
        paragraph(
          'Un evento con repetición se guarda como una sola serie, así que cambiar uno de sus días casi siempre pregunta antes qué alcance quieres.',
        ),
        heading('Al eliminar'),
        paragraph(
          'Siempre puedes elegir entre borrar solo ese día o toda la serie, en Android y en iPhone por igual.',
        ),
        heading('Al guardar un cambio'),
        paragraph(
          'En iPhone puedes elegir entre ese día o toda la serie, igual que al eliminar. En un calendario de una cuenta de Android el cambio siempre se aplica a toda la serie: el sistema no permite guardar una excepción para un solo día, y la app te lo dice antes de guardar.',
        ),
        note(
          'Cambiar la hora de una repetición mueve toda la serie ese mismo desplazamiento, no solo el día que tocaste: mover el lunes una hora adelanta la serie entera una hora, no la convierte en el lunes de otra semana.',
        ),
      ],
      en: [
        paragraph(
          'An event with a repetition is stored as a single series, so changing one of its days almost always asks first what you mean it to reach.',
        ),
        heading('When deleting'),
        paragraph(
          'You can always choose between deleting only that day or the whole series, on Android and on iPhone alike.',
        ),
        heading('When saving a change'),
        paragraph(
          'On iPhone you can choose between that day or the whole series, same as when deleting. In a calendar of an Android account the change always applies to the whole series: the system does not allow saving an exception for a single day, and the app says so before saving.',
        ),
        note(
          'Changing the time of a repetition moves the whole series by that same amount, not just the day you touched: moving Monday an hour brings the entire series forward an hour, it does not turn it into the Monday of another week.',
        ),
      ],
      ca: [
        paragraph(
          'Un esdeveniment amb repetició es desa com una sola sèrie, així que canviar-ne un dia gairebé sempre pregunta abans quin abast vols.',
        ),
        heading('En eliminar'),
        paragraph(
          'Sempre pots triar entre esborrar només aquell dia o tota la sèrie, tant a Android com a iPhone.',
        ),
        heading('En desar un canvi'),
        paragraph(
          'A iPhone pots triar entre aquell dia o tota la sèrie, igual que en eliminar. En un calendari d’un compte d’Android el canvi sempre s’aplica a tota la sèrie: el sistema no permet desar una excepció per a un sol dia, i l’app t’ho diu abans de desar.',
        ),
        note(
          'Canviar l’hora d’una repetició mou tota la sèrie aquell mateix desplaçament, no només el dia que has tocat: moure el dilluns una hora avança la sèrie sencera una hora, no la converteix en el dilluns d’una altra setmana.',
        ),
      ],
    },
  },
  {
    slug: 'borrar-un-elemento',
    title: {
      es: 'Cómo borrar un evento, una tarea o un hábito',
      en: 'How to delete an event, a task or a habit',
      ca: 'Com esborrar un esdeveniment, una tasca o un hàbit',
    },
    meta: meta(2, 'basics'),
    icon: TrashIcon,
    blocks: {
      es: [
        paragraph(
          'Cada tipo de elemento se borra desde su propia ficha, y el gesto es el mismo en las tres: abrir los ajustes del elemento y elegir Eliminar.',
        ),
        heading('Desde la pantalla principal'),
        step(
          'Toca el icono de ajustes del elemento: en una tarea está al final de la fila; en un hábito, en la esquina superior derecha de la tarjeta.',
        ),
        step('En la ficha, baja hasta el final y pulsa Eliminar.'),
        step(
          'Confirma. Dispones de cinco segundos para deshacer desde el aviso inferior.',
        ),
        heading('Eventos repetidos'),
        paragraph(
          'Al borrar un evento que se repite, la app pregunta si quieres eliminar solo esa fecha, esa y las siguientes, o toda la serie.',
        ),
        note(
          'Borrar un hábito elimina también su histórico de rachas. Si solo quieres dejar de verlo, archívalo desde la misma ficha.',
        ),
      ],
      en: [
        paragraph(
          'Each kind of item is deleted from its own form, and the gesture is the same in all three: open the item settings and choose Delete.',
        ),
        heading('From the main screen'),
        step(
          'Tap the item settings icon: on a task it sits at the end of the row; on a habit, in the top right corner of the card.',
        ),
        step('In the form, scroll to the end and press Delete.'),
        step(
          'Confirm. You have five seconds to undo it from the notice at the bottom.',
        ),
        heading('Repeating events'),
        paragraph(
          'When deleting an event that repeats, the app asks whether you mean only that date, that one and the ones after it, or the whole series.',
        ),
        note(
          'Deleting a habit also removes its streak history. If you only want it out of sight, archive it from the same form.',
        ),
      ],
      ca: [
        paragraph(
          'Cada tipus d’element s’esborra des de la seva pròpia fitxa, i el gest és el mateix en tots tres: obrir la configuració de l’element i triar Elimina.',
        ),
        heading('Des de la pantalla principal'),
        step(
          'Toca la icona de configuració de l’element: en una tasca és al final de la fila; en un hàbit, a la cantonada superior dreta de la targeta.',
        ),
        step('A la fitxa, baixa fins al final i prem Elimina.'),
        step(
          'Confirma. Tens cinc segons per desfer-ho des de l’avís inferior.',
        ),
        heading('Esdeveniments repetits'),
        paragraph(
          'En esborrar un esdeveniment que es repeteix, l’app pregunta si vols eliminar només aquella data, aquella i les següents, o tota la sèrie.',
        ),
        note(
          'Esborrar un hàbit n’elimina també l’històric de ratxes. Si només el vols deixar de veure, arxiva’l des de la mateixa fitxa.',
        ),
      ],
    },
  },
  {
    slug: 'sincronizar-google',
    title: {
      es: 'Sincronizar varias cuentas de Google',
      en: 'Syncing several Google accounts',
      ca: 'Sincronitzar diversos comptes de Google',
    },
    meta: meta(3, 'accounts'),
    icon: ArrowsClockwiseIcon,
    blocks: {
      es: [
        paragraph(
          'La app no conecta cuentas: lee las que tu teléfono ya sincroniza. Añade allí las que quieras y decide aquí, calendario a calendario, cuáles se muestran.',
        ),
        step('Abre el menú lateral y pulsa Añadir cuenta o calendario.'),
        step(
          'En la pestaña Cuenta, pulsa Abrir ajustes y añade la cuenta en el teléfono.',
        ),
        step(
          'Vuelve a la app: sus calendarios aparecen solos en el menú lateral, donde marcas los que quieres ver.',
        ),
        note(
          'Desmarcar un calendario solo lo oculta: no borra nada ni deja de sincronizar en el servidor.',
        ),
      ],
      en: [
        paragraph(
          'The app connects no accounts: it reads the ones your phone already syncs. Add whichever you want there, and decide here, calendar by calendar, which ones show up.',
        ),
        step('Open the side menu and press Add account or calendar.'),
        step(
          'On the Account tab, press Open settings and add the account on the phone.',
        ),
        step(
          'Come back to the app: its calendars turn up on their own in the side menu, where you tick the ones you want to see.',
        ),
        note(
          'Unticking a calendar only hides it: it deletes nothing and stops nothing from syncing on the server.',
        ),
      ],
      ca: [
        paragraph(
          'L’app no connecta comptes: llegeix els que el teu telèfon ja sincronitza. Afegeix-hi els que vulguis i decideix aquí, calendari a calendari, quins es mostren.',
        ),
        step('Obre el menú lateral i prem Afegeix compte o calendari.'),
        step(
          'A la pestanya Compte, prem Obre la configuració i afegeix el compte al telèfon.',
        ),
        step(
          'Torna a l’app: els seus calendaris apareixen sols al menú lateral, on marques els que vols veure.',
        ),
        note(
          'Desmarcar un calendari només l’amaga: no esborra res ni deixa de sincronitzar al servidor.',
        ),
      ],
    },
  },
  {
    slug: 'invitar-a-un-evento',
    title: {
      es: 'Cómo invitar a alguien a un evento',
      en: 'How to invite somebody to an event',
      ca: 'Com convidar algú a un esdeveniment',
    },
    meta: meta(2, 'accounts'),
    icon: UserPlusIcon,
    blocks: {
      es: [
        paragraph(
          'La ficha del evento tiene una lista de invitados con un botón para añadir uno por correo. Lo que pasa después depende de dónde vive el evento.',
        ),
        step('Abre el evento y ve al bloque Invitados.'),
        step('Pulsa el botón de añadir, escribe el correo y confirma.'),
        note(
          'En un calendario de una cuenta de Google u Outlook la invitación la manda esa cuenta de verdad, igual que si la escribieras desde el ordenador: la app no envía nada por su cuenta. En un calendario propio de la app el invitado se queda apuntado como una nota, sin que le llegue nada. Y en un calendario del iPhone no se puede invitar desde ninguna app: es una limitación del propio sistema.',
        ),
        note(
          'Quitar a alguien de la lista y guardar retira la invitación donde eso es posible.',
        ),
      ],
      en: [
        paragraph(
          'The event form has a guest list with a button to add one by email. What happens next depends on where the event lives.',
        ),
        step('Open the event and go to the Guests block.'),
        step('Press the add button, write the address and confirm.'),
        note(
          'In a calendar of a Google or Outlook account the invitation is really sent by that account, exactly as if you had written it from a computer: the app sends nothing of its own. In a calendar belonging to the app the guest stays written down as a note, and nothing reaches them. And in an iPhone calendar no app can invite anybody: that is a limitation of the system itself.',
        ),
        note(
          'Taking somebody off the list and saving withdraws the invitation where that is possible.',
        ),
      ],
      ca: [
        paragraph(
          'La fitxa de l’esdeveniment té una llista de convidats amb un botó per afegir-ne un per correu. El que passa després depèn d’on viu l’esdeveniment.',
        ),
        step('Obre l’esdeveniment i ves al bloc Convidats.'),
        step('Prem el botó d’afegir, escriu el correu i confirma.'),
        note(
          'En un calendari d’un compte de Google o Outlook la invitació l’envia aquell compte de debò, igual que si l’escrivissis des de l’ordinador: l’app no envia res pel seu compte. En un calendari propi de l’app el convidat queda apuntat com una nota, sense que li arribi res. I en un calendari de l’iPhone no es pot convidar des de cap app: és una limitació del mateix sistema.',
        ),
        note(
          'Treure algú de la llista i desar retira la invitació on això és possible.',
        ),
      ],
    },
  },
  {
    slug: 'recordatorios-de-habito',
    title: {
      es: 'Configurar los recordatorios de un hábito',
      en: 'Setting up the reminders of a habit',
      ca: 'Configurar els recordatoris d’un hàbit',
    },
    meta: meta(2, 'habits'),
    icon: BellIcon,
    blocks: {
      es: [
        paragraph(
          'Los hábitos no avisan «X minutos antes» como los eventos: avisan a las horas del día que tú marques.',
        ),
        step('Abre el hábito y ve a Notificaciones.'),
        step('Pulsa Añadir hora y toca la hora para ajustarla.'),
        step(
          'En los hábitos semanales, marca además los días en los que quieres el aviso.',
        ),
        paragraph(
          'Si un hábito es de varias veces al día, añade una hora por repetición: la app deja de avisar en cuanto completas todas.',
        ),
      ],
      en: [
        paragraph(
          'Habits do not warn you "X minutes before" the way events do: they warn you at the times of day you set.',
        ),
        step('Open the habit and go to Notifications.'),
        step('Press Add time and tap the time to adjust it.'),
        step(
          'On weekly habits, tick the days you want the reminder on as well.',
        ),
        paragraph(
          'If a habit happens several times a day, add one time per repetition: the app stops warning you as soon as you complete them all.',
        ),
      ],
      ca: [
        paragraph(
          'Els hàbits no avisen «X minuts abans» com els esdeveniments: avisen a les hores del dia que tu marquis.',
        ),
        step('Obre l’hàbit i ves a Notificacions.'),
        step('Prem Afegeix hora i toca l’hora per ajustar-la.'),
        step(
          'En els hàbits setmanals, marca a més els dies en què vols l’avís.',
        ),
        paragraph(
          'Si un hàbit és de diverses vegades al dia, afegeix una hora per repetició: l’app deixa d’avisar tan bon punt les completes totes.',
        ),
      ],
    },
  },
  {
    slug: 'avisos-no-llegan',
    title: {
      es: 'Por qué no me llega un aviso a tiempo',
      en: 'Why a reminder does not reach me in time',
      ca: 'Per què no m’arriba un avís a temps',
    },
    meta: meta(2, 'reminders'),
    icon: BellIcon,
    blocks: {
      es: [
        paragraph(
          'Los avisos son notificaciones locales: los programa el propio teléfono, sin ningún servidor de por medio, así que si no suenan la causa está en el sistema, no en internet.',
        ),
        step(
          'Comprueba que la app tiene permiso de notificaciones en Ajustes del sistema › Apps › D-Calendar.',
        ),
        step(
          'Si el aviso de todos modos llega tarde en un Android antiguo, revisa que la app no esté en la lista de optimización de batería del fabricante.',
        ),
        note(
          'Solo se programan los avisos de los próximos 30 días. Uno de un evento más lejano en el futuro no se pierde: se programa solo en cuanto entra en esa ventana, y lo que la hace avanzar es abrir la app de vez en cuando, aunque sea de pasada.',
        ),
      ],
      en: [
        paragraph(
          'Reminders are local notifications: the phone itself schedules them, with no server in between, so if they do not sound the cause is in the system, not on the internet.',
        ),
        step(
          'Check that the app has notification permission in System settings › Apps › D-Calendar.',
        ),
        step(
          'If the reminder still arrives late on an older Android, check that the app is not on the manufacturer’s battery optimisation list.',
        ),
        note(
          'Only the reminders of the next 30 days are scheduled. One belonging to an event further into the future is not lost: it schedules itself as soon as it enters that window, and what moves the window forward is opening the app now and then, even briefly.',
        ),
      ],
      ca: [
        paragraph(
          'Els avisos són notificacions locals: els programa el mateix telèfon, sense cap servidor pel mig, així que si no sonen la causa és al sistema, no a internet.',
        ),
        step(
          'Comprova que l’app té permís de notificacions a Configuració del sistema › Apps › D-Calendar.',
        ),
        step(
          'Si l’avís tot i així arriba tard en un Android antic, revisa que l’app no sigui a la llista d’optimització de bateria del fabricant.',
        ),
        note(
          'Només es programen els avisos dels propers 30 dies. Un d’un esdeveniment més llunyà en el futur no es perd: es programa sol tan bon punt entra en aquella finestra, i el que la fa avançar és obrir l’app de tant en tant, encara que sigui de passada.',
        ),
      ],
    },
  },
  {
    slug: 'tarea-o-habito',
    title: {
      es: 'Qué diferencia hay entre una tarea y un hábito',
      en: 'What the difference is between a task and a habit',
      ca: 'Quina diferència hi ha entre una tasca i un hàbit',
    },
    meta: meta(1, 'basics'),
    icon: ListChecksIcon,
    blocks: {
      es: [
        paragraph(
          'Una tarea se hace una vez y desaparece. Un hábito se repite y guarda una racha.',
        ),
        paragraph(
          'Por eso las tareas viven en una lista, con su círculo de completado, y los hábitos en una rejilla, con tantos marcadores como repeticiones tenga el día o la semana.',
        ),
        note(
          'Si una tarea se te repite cada semana, probablemente sea un hábito.',
        ),
      ],
      en: [
        paragraph(
          'A task is done once and goes away. A habit repeats and keeps a streak.',
        ),
        paragraph(
          'That is why tasks live in a list, with their completion circle, and habits in a grid, with as many markers as the day or the week has repetitions.',
        ),
        note(
          'If a task keeps coming back to you every week, it is probably a habit.',
        ),
      ],
      ca: [
        paragraph(
          'Una tasca es fa un cop i desapareix. Un hàbit es repeteix i guarda una ratxa.',
        ),
        paragraph(
          'Per això les tasques viuen en una llista, amb el seu cercle de completat, i els hàbits en una graella, amb tants marcadors com repeticions tingui el dia o la setmana.',
        ),
        note(
          'Si una tasca se’t repeteix cada setmana, probablement sigui un hàbit.',
        ),
      ],
    },
  },
  {
    slug: 'color-de-remarcado',
    title: {
      es: 'Cambiar el color de remarcado',
      en: 'Changing the accent colour',
      ca: 'Canviar el color de remarcat',
    },
    meta: meta(1, 'appearance'),
    icon: DropHalfIcon,
    blocks: {
      es: [
        paragraph(
          'El color de remarcado se usa para el día de hoy, los indicadores de evento y todo lo que marcas como hecho.',
        ),
        step('Ve a Ajustes › Apariencia › Color de remarcado.'),
        step('Elige uno de los seis colores del selector.'),
        note(
          'La paleta es cerrada a propósito: son los seis tonos que mantienen el contraste sobre el fondo oscuro.',
        ),
      ],
      en: [
        paragraph(
          'The accent colour is used for today, the event dots and everything you mark as done.',
        ),
        step('Go to Settings › Appearance › Accent colour.'),
        step('Pick one of the six colours in the selector.'),
        note(
          'The palette is closed on purpose: those are the six tones that keep their contrast against the dark background.',
        ),
      ],
      ca: [
        paragraph(
          'El color de remarcat es fa servir per al dia d’avui, els indicadors d’esdeveniment i tot el que marques com a fet.',
        ),
        step('Ves a Configuració › Aparença › Color de remarcat.'),
        step('Tria un dels sis colors del selector.'),
        note(
          'La paleta és tancada a propòsit: són els sis tons que mantenen el contrast sobre el fons fosc.',
        ),
      ],
    },
  },
  {
    slug: 'importar-exportar-ics',
    title: {
      es: 'Importar o exportar un calendario (.ics)',
      en: 'Importing or exporting a calendar (.ics)',
      ca: 'Importar o exportar un calendari (.ics)',
    },
    meta: meta(3, 'accounts'),
    icon: DownloadSimpleIcon,
    blocks: {
      es: [
        paragraph(
          'Los archivos .ics sirven tanto para suscribirse a un calendario externo como para llevarte tus eventos a otra app.',
        ),
        step(
          'Para importar: menú lateral › Añadir cuenta o calendario › pegar la URL del .ics.',
        ),
        step(
          'Para exportar: Ajustes › Calendarios › menú de la cuenta › Exportar.',
        ),
        note(
          'Los calendarios suscritos por URL son de solo lectura: no podrás crear eventos dentro de ellos. Se descargan al añadirlos, al abrir la app y al pulsar sincronizar en el menú lateral.',
        ),
      ],
      en: [
        paragraph(
          '.ics files serve both to subscribe to an outside calendar and to take your events to another app.',
        ),
        step(
          'To import: side menu › Add account or calendar › paste the .ics URL.',
        ),
        step(
          'To export: Settings › Calendars › the account menu › Export.',
        ),
        note(
          'Calendars subscribed to by URL are read only: you will not be able to create events inside them. They are downloaded when you add them, when you open the app and when you press refresh in the side menu.',
        ),
      ],
      ca: [
        paragraph(
          'Els fitxers .ics serveixen tant per subscriure’s a un calendari extern com per emportar-te els teus esdeveniments a una altra app.',
        ),
        step(
          'Per importar: menú lateral › Afegeix compte o calendari › enganxa l’URL del .ics.',
        ),
        step(
          'Per exportar: Configuració › Calendaris › menú del compte › Exporta.',
        ),
        note(
          'Els calendaris subscrits per URL són de només lectura: no hi podràs crear esdeveniments. Es descarreguen en afegir-los, en obrir l’app i en prémer sincronitza al menú lateral.',
        ),
      ],
    },
  },
  {
    slug: 'por-que-no-puedo-editar',
    title: {
      es: 'Por qué no puedo editar ni invitar en algunos eventos',
      en: 'Why I cannot edit or invite on some events',
      ca: 'Per què no puc editar ni convidar en alguns esdeveniments',
    },
    meta: meta(1, 'accounts'),
    icon: LockSimpleIcon,
    blocks: {
      es: [
        paragraph(
          'Un evento aparece pero no se deja tocar en tres situaciones, y las tres son intencionadas.',
        ),
        step(
          'Viene de un calendario suscrito por URL (.ics): es una copia de un archivo de un servidor, y ahí no hay nada que escribir.',
        ),
        step(
          'Te lo ha invitado otra persona: aparece en tu calendario, pero sigue siendo su evento. Se cambia donde se creó.',
        ),
        step(
          'El propio sistema no deja escribir en ese calendario, por ejemplo uno que alguien comparte contigo solo para verlo.',
        ),
        note(
          'En los tres casos los avisos siguen siendo tuyos y se pueden cambiar: son de la app, no del evento.',
        ),
      ],
      en: [
        paragraph(
          'An event shows up but will not let itself be touched in three situations, and all three are deliberate.',
        ),
        step(
          'It comes from a calendar subscribed to by URL (.ics): it is a copy of a file on a server, and there is nothing there to write to.',
        ),
        step(
          'Somebody else invited you to it: it appears in your calendar, but it is still their event. It is changed where it was created.',
        ),
        step(
          'The system itself does not allow writing in that calendar, for instance one somebody shares with you just to look at.',
        ),
        note(
          'In all three cases the reminders are still yours and can be changed: they belong to the app, not to the event.',
        ),
      ],
      ca: [
        paragraph(
          'Un esdeveniment apareix però no es deixa tocar en tres situacions, i totes tres són intencionades.',
        ),
        step(
          'Ve d’un calendari subscrit per URL (.ics): és una còpia d’un fitxer d’un servidor, i allà no hi ha res a escriure.',
        ),
        step(
          'T’hi ha convidat una altra persona: apareix al teu calendari, però continua sent el seu esdeveniment. Es canvia on es va crear.',
        ),
        step(
          'El mateix sistema no deixa escriure en aquell calendari, per exemple un que algú comparteix amb tu només per veure’l.',
        ),
        note(
          'En els tres casos els avisos continuen sent teus i es poden canviar: són de l’app, no de l’esdeveniment.',
        ),
      ],
    },
  },
];

/**
 * Looks up an article by its slug.
 *
 * Postcondition: returns `undefined` when the slug does not exist, which is
 * what the screen uses to redirect to the help list.
 *
 * @param slug Slug coming from the route.
 */
export const topicBySlug = (slug: string) =>
  TOPICS.find((topic) => topic.slug === slug);
