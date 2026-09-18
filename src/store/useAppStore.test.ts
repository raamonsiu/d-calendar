import { useAppStore } from './useAppStore';

/**
 * `deviceEventsRead` is what the welcome overlay waits on before it trusts the
 * events count. A read that came back has to set it, even one with nothing to
 * read because the permission is missing; a read that failed must not, or the
 * overlay would show a failure as a day with no events.
 */
describe('ending a read of the device calendars', () => {
  beforeEach(() => {
    useAppStore.setState({ deviceEventsRead: false, refreshing: true });
  });

  test('a read with nothing to read marks the device calendars as read', () => {
    useAppStore.getState().finishRefresh(null);

    expect(useAppStore.getState().deviceEventsRead).toBe(true);
    expect(useAppStore.getState().refreshing).toBe(false);
  });

  test('a read that came back marks the device calendars as read', () => {
    useAppStore
      .getState()
      .finishRefresh({ accounts: [], calendars: [], events: [] });

    expect(useAppStore.getState().deviceEventsRead).toBe(true);
    expect(useAppStore.getState().refreshing).toBe(false);
  });

  test('a read that failed ends the refresh without marking them as read', () => {
    useAppStore.getState().failRefresh();

    expect(useAppStore.getState().deviceEventsRead).toBe(false);
    expect(useAppStore.getState().refreshing).toBe(false);
  });
});
