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
 */

/** The four block types the article knows how to draw. */
export type Block =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'step'; text: string }
  | { type: 'note'; text: string };

export type Topic = {
  /** Last segment of the URL: `/help/[slug]`. */
  slug: string;
  title: string;
  /** Micro label with the reading time and the category. */
  meta: string;
  icon: Icon;
  blocks: Block[];
};

const paragraph = (text: string): Block => ({ type: 'p', text });
const heading = (text: string): Block => ({ type: 'h', text });
const step = (text: string): Block => ({ type: 'step', text });
const note = (text: string): Block => ({ type: 'note', text });

export const TOPICS: Topic[] = [
  {
    slug: 'crear-un-elemento',
    title: 'Cómo crear un evento, una tarea o un hábito',
    meta: '1 MIN · BÁSICOS',
    icon: PlusIcon,
    blocks: [
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
  },
  {
    slug: 'editar-un-elemento',
    title: 'Cómo editar un evento, una tarea o un hábito',
    meta: '1 MIN · BÁSICOS',
    icon: PencilSimpleIcon,
    blocks: [
      paragraph(
        'Toca el elemento desde la pantalla principal para abrir la misma ficha con la que se creó, ahora con sus datos rellenos.',
      ),
      step('Cambia lo que haga falta.'),
      step(
        'El botón Guardar cambios aparece solo cuando algo es distinto de como estaba: si abres una ficha y no tocas nada, no hay nada que guardar y el botón no sale.',
      ),
      note(
        'En un evento que no es tuyo — la invitación de otra persona, o un calendario al que solo estás suscrito — la ficha se ve pero no se puede tocar. Solo los avisos, que son de la app y no del evento, siguen siendo tuyos.',
      ),
    ],
  },
  {
    slug: 'eventos-que-se-repiten',
    title: 'Editar o eliminar un evento que se repite',
    meta: '2 MIN · BÁSICOS',
    icon: RepeatIcon,
    blocks: [
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
        'Cambiar la hora de una repetición mueve toda la serie ese mismo desplazamiento, no solo el día que tocaste — mover el lunes una hora adelanta la serie entera una hora, no la convierte en el lunes de otra semana.',
      ),
    ],
  },
  {
    slug: 'borrar-un-elemento',
    title: 'Cómo borrar un evento, una tarea o un hábito',
    meta: '2 MIN · BÁSICOS',
    icon: TrashIcon,
    blocks: [
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
  },
  {
    slug: 'sincronizar-google',
    title: 'Sincronizar varias cuentas de Google',
    meta: '3 MIN · CUENTAS',
    icon: ArrowsClockwiseIcon,
    blocks: [
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
  },
  {
    slug: 'invitar-a-un-evento',
    title: 'Cómo invitar a alguien a un evento',
    meta: '2 MIN · CUENTAS',
    icon: UserPlusIcon,
    blocks: [
      paragraph(
        'La ficha del evento tiene una lista de invitados con un botón para añadir uno por correo. Lo que pasa después depende de dónde vive el evento.',
      ),
      step('Abre el evento y ve al bloque Invitados.'),
      step('Pulsa el botón de añadir, escribe el correo y confirma.'),
      note(
        'En un calendario de una cuenta de Google u Outlook la invitación la manda esa cuenta de verdad, igual que si la escribieras desde el ordenador: la app no envía nada por su cuenta. En un calendario propio de la app el invitado se queda apuntado como una nota, sin que le llegue nada. Y en un calendario del iPhone no se puede invitar desde ninguna app: es una limitación del propio sistema.',
      ),
      note('Quitar a alguien de la lista y guardar retira la invitación donde eso es posible.'),
    ],
  },
  {
    slug: 'recordatorios-de-habito',
    title: 'Configurar los recordatorios de un hábito',
    meta: '2 MIN · HÁBITOS',
    icon: BellIcon,
    blocks: [
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
  },
  {
    slug: 'avisos-no-llegan',
    title: 'Por qué no me llega un aviso a tiempo',
    meta: '2 MIN · AVISOS',
    icon: BellIcon,
    blocks: [
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
  },
  {
    slug: 'tarea-o-habito',
    title: 'Qué diferencia hay entre una tarea y un hábito',
    meta: '1 MIN · BÁSICOS',
    icon: ListChecksIcon,
    blocks: [
      paragraph(
        'Una tarea se hace una vez y desaparece. Un hábito se repite y guarda una racha.',
      ),
      paragraph(
        'Por eso las tareas viven en una lista, con su círculo de completado, y los hábitos en una rejilla, con tantos marcadores como repeticiones tenga el día o la semana.',
      ),
      note('Si una tarea se te repite cada semana, probablemente sea un hábito.'),
    ],
  },
  {
    slug: 'color-de-remarcado',
    title: 'Cambiar el color de remarcado',
    meta: '1 MIN · APARIENCIA',
    icon: DropHalfIcon,
    blocks: [
      paragraph(
        'El color de remarcado se usa para el día de hoy, los indicadores de evento y todo lo que marcas como hecho.',
      ),
      step('Ve a Ajustes › Apariencia › Color de remarcado.'),
      step('Elige uno de los seis colores del selector.'),
      note(
        'La paleta es cerrada a propósito: son los seis tonos que mantienen el contraste sobre el fondo oscuro.',
      ),
    ],
  },
  {
    slug: 'importar-exportar-ics',
    title: 'Importar o exportar un calendario (.ics)',
    meta: '3 MIN · CUENTAS',
    icon: DownloadSimpleIcon,
    blocks: [
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
  },
  {
    slug: 'por-que-no-puedo-editar',
    title: 'Por qué no puedo editar ni invitar en algunos eventos',
    meta: '1 MIN · CUENTAS',
    icon: LockSimpleIcon,
    blocks: [
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
