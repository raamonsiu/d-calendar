/**
 * Content of the privacy policy and the terms of use.
 *
 * Same shape as `src/data/help.ts` on purpose: it is the same kind of
 * document - headings, paragraphs, notes - read by the same article screen,
 * `src/app/legal/[slug].tsx`. `src/app/legal/licenses.tsx` is the one legal
 * screen that does not fit this shape, because a licence list is rows of
 * data, not prose.
 */

export type LegalBlock =
  | { type: 'h'; text: string }
  | { type: 'p'; text: string }
  | { type: 'note'; text: string };

export type LegalDocument = {
  /** Last segment of the URL: `/legal/[slug]`. */
  slug: string;
  title: string;
  /** Shown under the title, so a reader knows how current the text is. */
  updated: string;
  blocks: LegalBlock[];
};

const heading = (text: string): LegalBlock => ({ type: 'h', text });
const paragraph = (text: string): LegalBlock => ({ type: 'p', text });
const note = (text: string): LegalBlock => ({ type: 'note', text });

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: 'privacidad',
    title: 'Política de privacidad',
    updated: 'Última actualización: agosto de 2026',
    blocks: [
      paragraph(
        'D-Calendar está pensada para que tus datos no salgan de tu teléfono. Esta página dice exactamente qué guarda, qué lee y qué no hace nunca.',
      ),
      heading('Lo que creas en la app se queda en tu teléfono'),
      paragraph(
        'Los eventos, tareas y hábitos que creas en un calendario propio de la app viven solo en tu dispositivo, guardados con el almacenamiento del propio sistema operativo. No hay una cuenta de D-Calendar, ni un servidor de D-Calendar donde eso se copie. Si desinstalas la app, esos datos desaparecen con ella.',
      ),
      heading('Los calendarios del teléfono son del teléfono, no de la app'),
      paragraph(
        'Cuando conectas una cuenta de Google, Outlook o iCloud, no lo haces dentro de D-Calendar: lo haces en los ajustes del sistema, como con cualquier otra app de calendario. D-Calendar únicamente lee y escribe en los calendarios que esa cuenta ya sincroniza en tu teléfono, a través de la API de calendario del propio sistema operativo: nunca ve tu contraseña ni inicia sesión en tu nombre.',
      ),
      note(
        'Lo que pase después con esos datos - cómo Google o Microsoft los tratan, cuánto los conservan, con quién los comparten - lo rige la política de privacidad de esa cuenta, no esta. Ya aceptaste esas condiciones el día que añadiste la cuenta al teléfono.',
      ),
      paragraph(
        'Un calendario al que te suscribes por una dirección .ics se descarga tal cual desde esa dirección, sin pasar por ningún servidor de D-Calendar. Es lectura pura: un archivo de texto que el teléfono pide directamente.',
      ),
      heading('Los avisos suenan en tu teléfono, no llegan por internet'),
      paragraph(
        'Los recordatorios son notificaciones locales: los programa el propio sistema operativo y saltan sin que ningún servidor esté al tanto. Un evento con invitados es la única excepción parcial, y ni siquiera pasa por D-Calendar: si el calendario donde lo creas admite invitados, es la cuenta que lo sincroniza - Google o la que sea - la que manda la invitación, exactamente igual que si la mandaras desde esa cuenta en el ordenador.',
      ),
      heading('Lo que no hay'),
      paragraph(
        'No hay analítica de terceros, no hay identificador de publicidad, no hay anuncios y no hay ningún dato tuyo a la venta. La app no sabe si la abres, cuánto tiempo la usas ni qué escribes en tus eventos, porque nada de eso se envía a ningún lado.',
      ),
      heading('Si nos escribes'),
      paragraph(
        'Ayuda y comentarios te deja mandar un mensaje. Lo que escribas ahí, y la dirección desde la que lo mandes si dejas una, se usa solo para leerlo y responderte: nunca para nada más.',
      ),
      heading('Permisos que pide la app'),
      paragraph(
        'Calendario, para leer y escribir en los que el sistema ya sincroniza. Notificaciones, para poder mostrarte un aviso. Y, en Android, permiso para programar avisos a la hora exacta, que es lo que evita que el sistema los retrase para ahorrar batería. Ninguno de los tres permite a la app hacer nada fuera de lo que describe esta página.',
      ),
      paragraph(
        'Si algo de esto cambia alguna vez, esta página cambiará con ello antes de que el cambio llegue a una actualización.',
      ),
    ],
  },
  {
    slug: 'terminos',
    title: 'Términos de uso',
    updated: 'Última actualización: agosto de 2026',
    blocks: [
      paragraph(
        'Al usar D-Calendar aceptas estos términos. Están escritos para leerse enteros en un minuto, porque la app tampoco hace demasiadas cosas.',
      ),
      heading('Qué es la app'),
      paragraph(
        'D-Calendar es una herramienta personal de calendario, tareas y hábitos, desarrollada de forma independiente. No es un servicio: no hay cuenta, no hay suscripción y no hay nada que dependa de un servidor para seguir funcionando.',
      ),
      heading('Uso permitido'),
      paragraph(
        'Puedes usar la app libremente para organizar tus propios eventos, tareas y hábitos, y para leer y editar los calendarios que tu cuenta del sistema ya sincroniza, dentro de lo que esa cuenta te deja hacer.',
      ),
      heading('Sin garantía'),
      paragraph(
        'La app se ofrece tal cual. Se ha probado con cuidado, pero al depender de los calendarios de terceros (Google, Outlook, iCloud) y de los permisos y la batería de cada teléfono, no se puede garantizar que un aviso llegue siempre al segundo o que un calendario sincronice de forma instantánea. El desarrollador no es responsable de una cita perdida por un fallo del sistema, del proveedor de calendario o de la conexión del teléfono.',
      ),
      heading('Contenido del usuario'),
      paragraph(
        'Lo que escribes en tus eventos, tareas y hábitos es tuyo. La app no reclama ningún derecho sobre ello, y como se explica en la política de privacidad, no llega a verlo nadie más que tú y las cuentas que decidas conectar.',
      ),
      heading('Cambios'),
      paragraph(
        'Estos términos pueden actualizarse conforme la app crezca. Una actualización que cambie algo relevante lo hará visible en Novedades.',
      ),
      note(
        'Si algo de esto no encaja con tu caso o tienes una duda concreta, Ayuda y comentarios es el sitio para preguntarlo.',
      ),
    ],
  },
];

/**
 * Looks up a legal document by its slug.
 *
 * Postcondition: returns `undefined` when the slug does not exist, which is
 * what the screen uses to redirect back to About.
 *
 * @param slug Slug coming from the route.
 */
export const legalDocumentBySlug = (slug: string) =>
  LEGAL_DOCUMENTS.find((document) => document.slug === slug);
