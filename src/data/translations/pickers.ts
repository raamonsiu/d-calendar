import type { Language } from '@/theme/prefs';

/** Copy of the date and time picker sheets in `src/ui/pickers.tsx`. */
export const pickers: Record<Language, Record<string, string>> = {
  es: {
    chooseDate: 'Elegir día',
    chooseTime: 'Elegir hora',
    previousMonth: 'Mes anterior',
    nextMonth: 'Mes siguiente',
    today: 'HOY',
    confirmTime: 'LISTO',
    hourWheel: 'hora',
    minuteWheel: 'minutos',
    dayOfMonth: '{{day}} de {{month}}',
  },
  en: {
    chooseDate: 'Choose date',
    chooseTime: 'Choose time',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    today: 'TODAY',
    confirmTime: 'DONE',
    hourWheel: 'hour',
    minuteWheel: 'minutes',
    dayOfMonth: '{{month}} {{day}}',
  },
  ca: {
    chooseDate: 'Tria un dia',
    chooseTime: 'Tria una hora',
    previousMonth: 'Mes anterior',
    nextMonth: 'Mes següent',
    today: 'AVUI',
    confirmTime: 'FET',
    hourWheel: 'hora',
    minuteWheel: 'minuts',
    dayOfMonth: '{{day}} de {{month}}',
  },
};
