import type { Language } from '@/theme/prefs';

/**
 * Copy shared by more than one screen: generic actions, mostly. Anything used
 * by a single screen lives in that screen's own namespace instead.
 */
export const common: Record<Language, Record<string, string>> = {
  es: {
    save: 'GUARDAR',
    cancel: 'CANCELAR',
    delete: 'ELIMINAR',
    edit: 'EDITAR',
    add: 'AÑADIR',
    close: 'CERRAR',
    back: 'ATRÁS',
    next: 'SIGUIENTE',
    done: 'HECHO',
  },
  en: {
    save: 'SAVE',
    cancel: 'CANCEL',
    delete: 'DELETE',
    edit: 'EDIT',
    add: 'ADD',
    close: 'CLOSE',
    back: 'BACK',
    next: 'NEXT',
    done: 'DONE',
  },
  ca: {
    save: 'DESA',
    cancel: "CANCEL·LA",
    delete: 'ELIMINA',
    edit: 'EDITA',
    add: 'AFEGEIX',
    close: 'TANCA',
    back: 'ENRERE',
    next: 'SEGÜENT',
    done: 'FET',
  },
};
