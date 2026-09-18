import type { Language } from '@/theme/prefs';

/**
 * Copy of the welcome overlay shown on a cold start: the greeting for each
 * part of the day, the headline in two pieces so "HOY" can be highlighted on
 * its own, the label of each count row in singular and plural, and the hint
 * under the swipe-up arrow, which names the direction in every language, plus
 * what a screen reader announces instead, since it cannot swipe, and for a
 * count that is not known yet.
 */
export const welcome: Record<Language, Record<string, string>> = {
  es: {
    greetingMorning: 'Buenos días',
    greetingAfternoon: 'Buenas tardes',
    greetingNight: 'Buenas noches',
    today: 'HOY',
    pending: 'te quedan por completar',
    allDone: 'no te queda nada pendiente',
    eventSingular: 'evento',
    eventPlural: 'eventos',
    taskSingular: 'tarea',
    taskPlural: 'tareas',
    habitSingular: 'hábito',
    habitPlural: 'hábitos',
    swipeHint: 'Desliza hacia arriba para entrar',
    enter: 'Entrar',
    unknownCount: 'desconocido',
  },
  en: {
    greetingMorning: 'Good morning',
    greetingAfternoon: 'Good afternoon',
    greetingNight: 'Good evening',
    today: 'TODAY',
    pending: 'you still have',
    allDone: "you're all done",
    eventSingular: 'event',
    eventPlural: 'events',
    taskSingular: 'task',
    taskPlural: 'tasks',
    habitSingular: 'habit',
    habitPlural: 'habits',
    swipeHint: 'Swipe up to continue',
    enter: 'Continue',
    unknownCount: 'unknown',
  },
  ca: {
    greetingMorning: 'Bon dia',
    greetingAfternoon: 'Bona tarda',
    greetingNight: 'Bona nit',
    today: 'AVUI',
    pending: 'et queden per completar',
    allDone: 'no et queda res pendent',
    eventSingular: 'esdeveniment',
    eventPlural: 'esdeveniments',
    taskSingular: 'tasca',
    taskPlural: 'tasques',
    habitSingular: 'hàbit',
    habitPlural: 'hàbits',
    swipeHint: 'Llisca amunt per entrar',
    enter: 'Entrar',
    unknownCount: 'desconegut',
  },
};
