import type { Language } from '@/lib/language';

/**
 * Content of the privacy policy and the terms of use.
 *
 * Same shape as `src/data/help.ts` on purpose: it is the same kind of
 * document - headings, paragraphs, notes - read by the same article screen,
 * `src/app/legal/[slug].tsx`. `src/app/legal/licenses.tsx` is the one legal
 * screen that does not fit this shape, because a licence list is rows of
 * data, not prose.
 *
 * The Spanish text is the original one. The English and Catalan versions are
 * translations of it, offered so the document can be read in the language the
 * app is running in.
 */

export type LegalBlock =
  | { type: 'h'; text: string }
  | { type: 'p'; text: string }
  | { type: 'note'; text: string };

export type LegalDocument = {
  /** Last segment of the URL: `/legal/[slug]`. Never translated. */
  slug: string;
  title: Record<Language, string>;
  /** Shown under the title, so a reader knows how current the text is. */
  updated: Record<Language, string>;
  blocks: Record<Language, LegalBlock[]>;
};

const heading = (text: string): LegalBlock => ({ type: 'h', text });
const paragraph = (text: string): LegalBlock => ({ type: 'p', text });
const note = (text: string): LegalBlock => ({ type: 'note', text });

/** Both documents were last revised at the same time. */
const UPDATED: Record<Language, string> = {
  es: 'Última actualización: agosto de 2026',
  en: 'Last updated: August 2026',
  ca: 'Última actualització: agost de 2026',
};

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: 'privacidad',
    title: {
      es: 'Política de privacidad',
      en: 'Privacy policy',
      ca: 'Política de privadesa',
    },
    updated: UPDATED,
    blocks: {
      es: [
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
          'Ayuda y comentarios te deja mandar un mensaje. Como la app no tiene servidor propio, ese mensaje viaja a través de EmailJS, un intermediario que solo lo convierte en un correo a la bandeja del desarrollador y no lo usa para nada más. Lo que escribas ahí, y la dirección desde la que lo mandes si dejas una, se usa solo para leerlo y responderte.',
        ),
        heading('Permisos que pide la app'),
        paragraph(
          'Calendario, para leer y escribir en los que el sistema ya sincroniza. Notificaciones, para poder mostrarte un aviso. Y, en Android, permiso para programar avisos a la hora exacta, que es lo que evita que el sistema los retrase para ahorrar batería. Ninguno de los tres permite a la app hacer nada fuera de lo que describe esta página.',
        ),
        paragraph(
          'Si algo de esto cambia alguna vez, esta página cambiará con ello antes de que el cambio llegue a una actualización.',
        ),
      ],
      en: [
        paragraph(
          'D-Calendar is built so that your data does not leave your phone. This page says exactly what it stores, what it reads and what it never does.',
        ),
        heading('What you create in the app stays on your phone'),
        paragraph(
          'The events, tasks and habits you create in a calendar belonging to the app live only on your device, stored with the operating system’s own storage. There is no D-Calendar account, and no D-Calendar server for any of it to be copied to. If you uninstall the app, that data goes with it.',
        ),
        heading('The calendars of the phone belong to the phone, not to the app'),
        paragraph(
          'When you connect a Google, Outlook or iCloud account, you do not do it inside D-Calendar: you do it in the system settings, as with any other calendar app. D-Calendar only reads and writes in the calendars that account already syncs on your phone, through the operating system’s own calendar API: it never sees your password and never signs in on your behalf.',
        ),
        note(
          'What happens to that data afterwards - how Google or Microsoft handle it, how long they keep it, who they share it with - is governed by the privacy policy of that account, not by this one. You accepted those terms the day you added the account to the phone.',
        ),
        paragraph(
          'A calendar you subscribe to by an .ics address is downloaded as it is from that address, without passing through any D-Calendar server. It is pure reading: a text file the phone requests directly.',
        ),
        heading('Reminders sound on your phone, they do not arrive over the internet'),
        paragraph(
          'Reminders are local notifications: the operating system itself schedules them and they go off without any server knowing about it. An event with guests is the one partial exception, and it does not even go through D-Calendar: if the calendar you create it in accepts guests, it is the account that syncs it - Google or whichever - that sends the invitation, exactly as if you had sent it from that account on a computer.',
        ),
        heading('What there is not'),
        paragraph(
          'There is no third-party analytics, no advertising identifier, no ads and no data of yours for sale. The app does not know whether you open it, how long you use it or what you write in your events, because none of that is sent anywhere.',
        ),
        heading('If you write to us'),
        paragraph(
          'Help and feedback lets you send a message. As the app has no server of its own, that message travels through EmailJS, an intermediary that only turns it into an email to the developer’s inbox and uses it for nothing else. What you write there, and the address you send it from if you leave one, is used only to read it and reply to you.',
        ),
        heading('Permissions the app asks for'),
        paragraph(
          'Calendar, to read and write in the ones the system already syncs. Notifications, so it can show you a reminder. And, on Android, permission to schedule reminders at the exact time, which is what stops the system from delaying them to save battery. None of the three lets the app do anything beyond what this page describes.',
        ),
        paragraph(
          'If any of this ever changes, this page will change with it before the change reaches an update.',
        ),
      ],
      ca: [
        paragraph(
          'D-Calendar està pensada perquè les teves dades no surtin del teu telèfon. Aquesta pàgina diu exactament què desa, què llegeix i què no fa mai.',
        ),
        heading('El que crees a l’app es queda al teu telèfon'),
        paragraph(
          'Els esdeveniments, tasques i hàbits que crees en un calendari propi de l’app viuen només al teu dispositiu, desats amb l’emmagatzematge del mateix sistema operatiu. No hi ha cap compte de D-Calendar, ni cap servidor de D-Calendar on això es copiï. Si desinstal·les l’app, aquestes dades desapareixen amb ella.',
        ),
        heading('Els calendaris del telèfon són del telèfon, no de l’app'),
        paragraph(
          'Quan connectes un compte de Google, Outlook o iCloud, no ho fas dins de D-Calendar: ho fas a la configuració del sistema, com amb qualsevol altra app de calendari. D-Calendar únicament llegeix i escriu als calendaris que aquell compte ja sincronitza al teu telèfon, a través de l’API de calendari del mateix sistema operatiu: mai no veu la teva contrasenya ni inicia sessió en nom teu.',
        ),
        note(
          'El que passi després amb aquestes dades - com les tracta Google o Microsoft, quant de temps les conserven, amb qui les comparteixen - ho regeix la política de privadesa d’aquell compte, no aquesta. Ja vas acceptar aquelles condicions el dia que vas afegir el compte al telèfon.',
        ),
        paragraph(
          'Un calendari al qual et subscrius per una adreça .ics es descarrega tal qual des d’aquella adreça, sense passar per cap servidor de D-Calendar. És lectura pura: un fitxer de text que el telèfon demana directament.',
        ),
        heading('Els avisos sonen al teu telèfon, no arriben per internet'),
        paragraph(
          'Els recordatoris són notificacions locals: els programa el mateix sistema operatiu i salten sense que cap servidor n’estigui al cas. Un esdeveniment amb convidats és l’única excepció parcial, i ni tan sols passa per D-Calendar: si el calendari on el crees admet convidats, és el compte que el sincronitza - Google o el que sigui - qui envia la invitació, exactament igual que si l’enviessis des d’aquell compte a l’ordinador.',
        ),
        heading('El que no hi ha'),
        paragraph(
          'No hi ha analítica de tercers, no hi ha identificador de publicitat, no hi ha anuncis i no hi ha cap dada teva a la venda. L’app no sap si l’obres, quanta estona la fas servir ni què escrius als teus esdeveniments, perquè res d’això no s’envia enlloc.',
        ),
        heading('Si ens escrius'),
        paragraph(
          'Ajuda i comentaris et deixa enviar un missatge. Com que l’app no té servidor propi, aquest missatge viatja a través d’EmailJS, un intermediari que només el converteix en un correu a la safata del desenvolupador i no el fa servir per a res més. El que hi escriguis, i l’adreça des de la qual l’enviïs si en deixes una, es fa servir només per llegir-lo i respondre’t.',
        ),
        heading('Permisos que demana l’app'),
        paragraph(
          'Calendari, per llegir i escriure als que el sistema ja sincronitza. Notificacions, per poder mostrar-te un avís. I, a Android, permís per programar avisos a l’hora exacta, que és el que evita que el sistema els retardi per estalviar bateria. Cap dels tres permet a l’app fer res fora del que descriu aquesta pàgina.',
        ),
        paragraph(
          'Si alguna cosa d’això canvia mai, aquesta pàgina canviarà amb això abans que el canvi arribi a una actualització.',
        ),
      ],
    },
  },
  {
    slug: 'terminos',
    title: {
      es: 'Términos de uso',
      en: 'Terms of use',
      ca: 'Termes d’ús',
    },
    updated: UPDATED,
    blocks: {
      es: [
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
      en: [
        paragraph(
          'By using D-Calendar you accept these terms. They are written to be read in full in a minute, because the app does not do all that many things either.',
        ),
        heading('What the app is'),
        paragraph(
          'D-Calendar is a personal calendar, tasks and habits tool, developed independently. It is not a service: there is no account, no subscription and nothing that depends on a server to keep working.',
        ),
        heading('Permitted use'),
        paragraph(
          'You may use the app freely to organise your own events, tasks and habits, and to read and edit the calendars your system account already syncs, within what that account lets you do.',
        ),
        heading('No warranty'),
        paragraph(
          'The app is offered as it is. It has been tested carefully, but as it depends on third-party calendars (Google, Outlook, iCloud) and on the permissions and the battery of each phone, it cannot be guaranteed that a reminder always arrives to the second or that a calendar syncs instantly. The developer is not responsible for an appointment missed through a failure of the system, of the calendar provider or of the phone’s connection.',
        ),
        heading('User content'),
        paragraph(
          'What you write in your events, tasks and habits is yours. The app claims no rights over it, and as the privacy policy explains, nobody gets to see it other than you and the accounts you decide to connect.',
        ),
        heading('Changes'),
        paragraph(
          'These terms may be updated as the app grows. An update that changes something relevant will make it visible in What’s new.',
        ),
        note(
          'If any of this does not fit your case, or you have a specific question, Help and feedback is the place to ask it.',
        ),
      ],
      ca: [
        paragraph(
          'En fer servir D-Calendar acceptes aquests termes. Estan escrits per llegir-se sencers en un minut, perquè l’app tampoc no fa gaires coses.',
        ),
        heading('Què és l’app'),
        paragraph(
          'D-Calendar és una eina personal de calendari, tasques i hàbits, desenvolupada de manera independent. No és un servei: no hi ha compte, no hi ha subscripció i no hi ha res que depengui d’un servidor per continuar funcionant.',
        ),
        heading('Ús permès'),
        paragraph(
          'Pots fer servir l’app lliurement per organitzar els teus propis esdeveniments, tasques i hàbits, i per llegir i editar els calendaris que el teu compte del sistema ja sincronitza, dins del que aquell compte et deixa fer.',
        ),
        heading('Sense garantia'),
        paragraph(
          'L’app s’ofereix tal com és. S’ha provat amb cura, però com que depèn dels calendaris de tercers (Google, Outlook, iCloud) i dels permisos i la bateria de cada telèfon, no es pot garantir que un avís arribi sempre al segon o que un calendari sincronitzi de manera instantània. El desenvolupador no és responsable d’una cita perduda per una fallada del sistema, del proveïdor de calendari o de la connexió del telèfon.',
        ),
        heading('Contingut de l’usuari'),
        paragraph(
          'El que escrius als teus esdeveniments, tasques i hàbits és teu. L’app no reclama cap dret sobre això i, com s’explica a la política de privadesa, no ho arriba a veure ningú més que tu i els comptes que decideixis connectar.',
        ),
        heading('Canvis'),
        paragraph(
          'Aquests termes es poden actualitzar a mesura que l’app creixi. Una actualització que canviï alguna cosa rellevant ho farà visible a Novetats.',
        ),
        note(
          'Si alguna cosa d’això no encaixa amb el teu cas o tens un dubte concret, Ajuda i comentaris és el lloc per preguntar-ho.',
        ),
      ],
    },
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
