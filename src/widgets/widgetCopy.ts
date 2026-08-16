import type { Language } from '@/lib/language';

/**
 * Copy of the widget and of its configuration screen.
 *
 * A plain record per language rather than `t()`, for the same reason
 * `domain.ts` is one: the widget is drawn by a headless task where the
 * `i18next` instance was never told which language to use, and the
 * configuration screen runs in its own activity, outside the app's tree.
 */
export const WIDGET_COPY: Record<
  Language,
  {
    pickAHabit: string;
    configureTitle: string;
    configureHint: string;
    noHabits: string;
    cancel: string;
  }
> = {
  es: {
    pickAHabit: 'Mantén pulsado el widget para elegir un hábito',
    configureTitle: 'Qué hábito quieres seguir',
    configureHint: 'El widget mostrará su progreso y sumará una repetición al tocarlo.',
    noHabits: 'Todavía no hay hábitos. Crea uno en la app y vuelve aquí.',
    cancel: 'CANCELAR',
  },
  en: {
    pickAHabit: 'Hold the widget to pick a habit',
    configureTitle: 'Which habit to follow',
    configureHint: 'The widget shows its progress, and tapping it adds one repetition.',
    noHabits: 'No habits yet. Create one in the app and come back.',
    cancel: 'CANCEL',
  },
  ca: {
    pickAHabit: 'Mantén premut el widget per triar un hàbit',
    configureTitle: 'Quin hàbit vols seguir',
    configureHint: 'El widget en mostrarà el progrés, i en tocar-lo hi sumarà una repetició.',
    noHabits: 'Encara no hi ha hàbits. Crea’n un a l’app i torna aquí.',
    cancel: 'CANCEL·LA',
  },
};
