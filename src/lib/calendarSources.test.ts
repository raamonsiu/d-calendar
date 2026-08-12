import {
  isAnotherPerson,
  placeCalendar,
  type CalendarOrigin,
} from './calendarSources';

const OWN_ACCOUNTS = new Set(['ramon@gmail.com', 'ramon.lopez@digimevo.com']);

const origin = (fields: Partial<CalendarOrigin>): CalendarOrigin => ({
  accountName: 'ramon@gmail.com',
  accountType: 'com.google',
  ownerAccount: '',
  internalName: '',
  ...fields,
});

describe('isAnotherPerson', () => {
  test('una direccion vacia no es otra persona', () => {
    expect(isAnotherPerson('', OWN_ACCOUNTS)).toBe(false);
  });

  test('el identificador que un proveedor pone a su propio calendario secundario no es una persona', () => {
    expect(
      isAnotherPerson(
        'abc123def456@group.calendar.google.com',
        OWN_ACCOUNTS,
      ),
    ).toBe(false);
  });

  test('una cuenta propia no es otra persona', () => {
    expect(isAnotherPerson('ramon.lopez@digimevo.com', OWN_ACCOUNTS)).toBe(
      false,
    );
  });

  test('la direccion de un companyero si es otra persona', () => {
    expect(isAnotherPerson('jefe@empresa.com', OWN_ACCOUNTS)).toBe(true);
  });

  test('ignora mayusculas y espacios', () => {
    expect(isAnotherPerson('  RAMON@GMAIL.COM ', OWN_ACCOUNTS)).toBe(false);
    expect(isAnotherPerson(' JEFE@EMPRESA.COM ', OWN_ACCOUNTS)).toBe(true);
  });
});

describe('placeCalendar', () => {
  test('sin owner es personal', () => {
    expect(
      placeCalendar(origin({ ownerAccount: '', internalName: '' })),
    ).toBe('personal');
  });

  test('el owner es la misma cuenta que sincroniza: personal', () => {
    expect(
      placeCalendar(
        origin({
          ownerAccount: 'ramon@gmail.com',
          internalName: 'ramon@gmail.com',
        }),
      ),
    ).toBe('personal');
  });

  test('un calendario secundario propio, cuyo owner es el identificador del propio calendario, sigue siendo personal', () => {
    const secondary = origin({
      ownerAccount: 'abc123@group.calendar.google.com',
      internalName: 'abc123@group.calendar.google.com',
    });
    expect(placeCalendar(secondary, OWN_ACCOUNTS)).toBe('personal');
  });

  test('el calendario de un companyero es shared', () => {
    const shared = origin({
      ownerAccount: 'jefe@empresa.com',
      internalName: 'jefe@empresa.com',
    });
    expect(placeCalendar(shared, OWN_ACCOUNTS)).toBe('shared');
  });

  test('otra cuenta propia del telefono sigue siendo personal', () => {
    const otherOwnAccount = origin({
      ownerAccount: 'ramon.lopez@digimevo.com',
      internalName: 'x',
    });
    expect(placeCalendar(otherOwnAccount, OWN_ACCOUNTS)).toBe('personal');
  });

  test('un calendario local del telefono es subscribed', () => {
    expect(
      placeCalendar(origin({ accountName: 'Mi teléfono', accountType: 'LOCAL' })),
    ).toBe('subscribed');
  });

  test('una version en español de un calendario publico es subscribed', () => {
    const publicHoliday = origin({
      ownerAccount: 'es.spain#holiday@group.v.calendar.google.com',
      internalName: 'es.spain#holiday@group.v.calendar.google.com',
    });
    expect(placeCalendar(publicHoliday)).toBe('subscribed');
  });
});
