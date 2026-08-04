import {
  ArrowsClockwiseIcon,
  BellIcon,
  DownloadSimpleIcon,
  DropHalfIcon,
  ListChecksIcon,
  TrashIcon,
  type Icon,
} from '@/ui/icons';

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'step'; text: string }
  | { type: 'note'; text: string };

export type Topic = {
  slug: string;
  title: string;
  meta: string;
  icon: Icon;
  blocks: Block[];
};

const p = (text: string): Block => ({ type: 'p', text });
const h = (text: string): Block => ({ type: 'h', text });
const s = (text: string): Block => ({ type: 'step', text });
const n = (text: string): Block => ({ type: 'note', text });

/**
 * Contenido de ayuda. El handoff prevé traerlo de markdown remoto con caché
 * local; de momento vive aquí, igual que en el prototipo.
 */
export const TOPICS: Topic[] = [
  {
    slug: 'borrar-un-elemento',
    title: 'Cómo borrar un evento, una tarea o un hábito',
    meta: '2 MIN · BÁSICOS',
    icon: TrashIcon,
    blocks: [
      p('Cada tipo de elemento se borra desde su propia ficha, y el gesto es el mismo en las tres: abrir los ajustes del elemento y elegir Eliminar.'),
      h('Desde la pantalla principal'),
      s('Toca el icono de ajustes del elemento: en una tarea está al final de la fila; en un hábito, en la esquina superior derecha de la tarjeta.'),
      s('En la ficha, baja hasta el final y pulsa Eliminar.'),
      s('Confirma. Dispones de cinco segundos para deshacer desde el aviso inferior.'),
      h('Eventos repetidos'),
      p('Al borrar un evento que se repite, la app pregunta si quieres eliminar solo esa fecha, esa y las siguientes, o toda la serie.'),
      n('Borrar un hábito elimina también su histórico de rachas. Si solo quieres dejar de verlo, archívalo desde la misma ficha.'),
    ],
  },
  {
    slug: 'sincronizar-google',
    title: 'Sincronizar varias cuentas de Google',
    meta: '3 MIN · CUENTAS',
    icon: ArrowsClockwiseIcon,
    blocks: [
      p('Puedes conectar tantas cuentas como necesites y decidir, calendario a calendario, cuáles se muestran.'),
      s('Abre el menú lateral y pulsa Añadir cuenta o calendario.'),
      s('Elige Google y completa el acceso en el navegador.'),
      s('De vuelta en el menú, marca las casillas de los calendarios que quieres ver.'),
      n('Desmarcar un calendario solo lo oculta: no borra nada ni deja de sincronizar en el servidor.'),
    ],
  },
  {
    slug: 'recordatorios-de-habito',
    title: 'Configurar los recordatorios de un hábito',
    meta: '2 MIN · HÁBITOS',
    icon: BellIcon,
    blocks: [
      p('Los hábitos no avisan «X minutos antes» como los eventos: avisan a las horas del día que tú marques.'),
      s('Abre el hábito y ve a Notificaciones.'),
      s('Pulsa Añadir hora y toca la hora para ajustarla.'),
      s('En los hábitos semanales, marca además los días en los que quieres el aviso.'),
      p('Si un hábito es de varias veces al día, añade una hora por repetición: la app deja de avisar en cuanto completas todas.'),
    ],
  },
  {
    slug: 'tarea-o-habito',
    title: 'Qué diferencia hay entre una tarea y un hábito',
    meta: '1 MIN · BÁSICOS',
    icon: ListChecksIcon,
    blocks: [
      p('Una tarea se hace una vez y desaparece. Un hábito se repite y guarda una racha.'),
      p('Por eso las tareas viven en una lista, con su círculo de completado, y los hábitos en una rejilla, con tantos marcadores como repeticiones tenga el día o la semana.'),
      n('Si una tarea se te repite cada semana, probablemente sea un hábito.'),
    ],
  },
  {
    slug: 'color-de-remarcado',
    title: 'Cambiar el color de remarcado',
    meta: '1 MIN · APARIENCIA',
    icon: DropHalfIcon,
    blocks: [
      p('El color de remarcado se usa para el día de hoy, los indicadores de evento y todo lo que marcas como hecho.'),
      s('Ve a Ajustes › Apariencia › Color de remarcado.'),
      s('Elige uno de los seis colores del selector.'),
      n('La paleta es cerrada a propósito: son los seis tonos que mantienen el contraste sobre el fondo oscuro.'),
    ],
  },
  {
    slug: 'importar-exportar-ics',
    title: 'Importar o exportar un calendario (.ics)',
    meta: '3 MIN · CUENTAS',
    icon: DownloadSimpleIcon,
    blocks: [
      p('Los archivos .ics sirven tanto para suscribirse a un calendario externo como para llevarte tus eventos a otra app.'),
      s('Para importar: menú lateral › Añadir cuenta o calendario › pegar la URL del .ics.'),
      s('Para exportar: Ajustes › Calendarios › menú de la cuenta › Exportar.'),
      n('Los calendarios suscritos por URL son de solo lectura: no podrás crear eventos dentro de ellos.'),
    ],
  },
];

export const topicBySlug = (slug: string) =>
  TOPICS.find((t) => t.slug === slug);
