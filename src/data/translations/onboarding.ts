import type { Language } from '@/theme/prefs';

/** Copy of the first-launch onboarding, shown once. */
export const onboarding: Record<Language, Record<string, string>> = {
  es: {
    welcomeTitle: 'Bienvenido a D-Calendar',
    welcomeTagline: 'Calendario, tareas y hábitos en una sola pantalla.',
    versionBadge: 'VERSIÓN {{version}}',
    buildBadge: 'BUILD {{build}}',

    permissionsTitle: 'Permisos requeridos',
    permissionsIntro:
      'Para que los avisos y los calendarios del teléfono funcionen, la app necesita estos dos permisos.',
    calendarPermissionLabel: 'Calendario',
    calendarPermissionHint: 'Leer y escribir en los calendarios del teléfono',
    notificationsPermissionLabel: 'Notificaciones',
    notificationsPermissionHint: 'Avisos de eventos, tareas y hábitos',
    statusGranted: 'Concedido',
    statusDenied: 'Denegado - toca para abrir los ajustes',
    statusPending: 'Toca para permitir',

    featuresTitle: 'Descubre la app',
    featureCreateLabel: 'Crea eventos',
    featureCreateHint: 'Organiza tu agenda con eventos y recordatorios',
    featureHabitsLabel: 'Sigue tus hábitos',
    featureHabitsHint: 'Marca tu progreso día a día',
    featureTasksLabel: 'Gestiona tareas',
    featureTasksHint: 'Con fecha límite o sin ella',
    openSourceLabel: 'Código abierto',
    openSourceHint: 'Licencia MIT y código en GitHub',

    back: 'ATRÁS',
    next: 'SIGUIENTE',
    getStarted: 'EMPEZAR',
  },
  en: {
    welcomeTitle: 'Welcome to D-Calendar',
    welcomeTagline: 'Calendar, tasks and habits on a single screen.',
    versionBadge: 'VERSION {{version}}',
    buildBadge: 'BUILD {{build}}',

    permissionsTitle: 'Required permissions',
    permissionsIntro:
      'For reminders and the phone calendars to work, the app needs these two permissions.',
    calendarPermissionLabel: 'Calendar',
    calendarPermissionHint: "Read and write to the phone's calendars",
    notificationsPermissionLabel: 'Notifications',
    notificationsPermissionHint: 'Alerts for events, tasks and habits',
    statusGranted: 'Granted',
    statusDenied: 'Denied - tap to open settings',
    statusPending: 'Tap to allow',

    featuresTitle: 'Discover the app',
    featureCreateLabel: 'Create events',
    featureCreateHint: 'Organise your agenda with events and reminders',
    featureHabitsLabel: 'Track your habits',
    featureHabitsHint: 'Mark your progress day by day',
    featureTasksLabel: 'Manage tasks',
    featureTasksHint: 'With a due date or without one',
    openSourceLabel: 'Open source',
    openSourceHint: 'MIT licence, code on GitHub',

    back: 'BACK',
    next: 'NEXT',
    getStarted: 'GET STARTED',
  },
  ca: {
    welcomeTitle: 'Benvingut a D-Calendar',
    welcomeTagline: 'Calendari, tasques i hàbits en una sola pantalla.',
    versionBadge: 'VERSIÓ {{version}}',
    buildBadge: 'BUILD {{build}}',

    permissionsTitle: 'Permisos necessaris',
    permissionsIntro:
      'Perquè els avisos i els calendaris del telèfon funcionin, l’app necessita aquests dos permisos.',
    calendarPermissionLabel: 'Calendari',
    calendarPermissionHint: 'Llegir i escriure als calendaris del telèfon',
    notificationsPermissionLabel: 'Notificacions',
    notificationsPermissionHint: 'Avisos d’esdeveniments, tasques i hàbits',
    statusGranted: 'Concedit',
    statusDenied: 'Denegat - toca per obrir els ajustos',
    statusPending: 'Toca per permetre',

    featuresTitle: 'Descobreix l’app',
    featureCreateLabel: 'Crea esdeveniments',
    featureCreateHint: 'Organitza la teva agenda amb esdeveniments i avisos',
    featureHabitsLabel: 'Segueix els teus hàbits',
    featureHabitsHint: 'Marca el teu progrés dia a dia',
    featureTasksLabel: 'Gestiona tasques',
    featureTasksHint: 'Amb data límit o sense',
    openSourceLabel: 'Codi obert',
    openSourceHint: 'Llicència MIT i codi a GitHub',

    back: 'ENRERE',
    next: 'SEGÜENT',
    getStarted: 'COMENÇAR',
  },
};
