import { toastRemainingShare } from './toast';

describe('toastRemainingShare', () => {
  it('is full for a toast that has just appeared', () => {
    expect(toastRemainingShare(1000, 1000, 5000)).toBe(1);
  });

  it('goes down with the time that has passed', () => {
    expect(toastRemainingShare(1000, 3500, 5000)).toBe(0.5);
  });

  it('is empty once the time is up, and stays there', () => {
    expect(toastRemainingShare(1000, 6000, 5000)).toBe(0);
    expect(toastRemainingShare(1000, 9000, 5000)).toBe(0);
  });

  it('never goes over 1 if the clock reads earlier than the start', () => {
    expect(toastRemainingShare(2000, 1000, 5000)).toBe(1);
  });

  it('is empty for a lifetime that is not positive', () => {
    expect(toastRemainingShare(0, 0, 0)).toBe(0);
  });
});
