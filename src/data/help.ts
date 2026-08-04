import {
  ArrowsClockwiseIcon,
  BellIcon,
  DownloadSimpleIcon,
  DropHalfIcon,
  ListChecksIcon,
  TrashIcon,
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
        'Puedes conectar tantas cuentas como necesites y decidir, calendario a calendario, cuáles se muestran.',
      ),
      step('Abre el menú lateral y pulsa Añadir cuenta o calendario.'),
      step('Elige Google y completa el acceso en el navegador.'),
      step(
        'De vuelta en el menú, marca las casillas de los calendarios que quieres ver.',
      ),
      note(
        'Desmarcar un calendario solo lo oculta: no borra nada ni deja de sincronizar en el servidor.',
      ),
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
        'Los calendarios suscritos por URL son de solo lectura: no podrás crear eventos dentro de ellos.',
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
