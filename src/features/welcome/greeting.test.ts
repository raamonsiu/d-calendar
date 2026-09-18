import { greetingPeriod } from './greeting';

describe('greetingPeriod', () => {
  test('the small hours still count as night', () => {
    expect(greetingPeriod(3, 'es')).toBe('night');
    expect(greetingPeriod(3, 'en')).toBe('night');
  });

  test('the morning starts at six in every language', () => {
    expect(greetingPeriod(5, 'ca')).toBe('night');
    expect(greetingPeriod(6, 'ca')).toBe('morning');
    expect(greetingPeriod(6, 'en')).toBe('morning');
  });

  test('Spanish keeps the morning until lunch, English only until noon', () => {
    expect(greetingPeriod(13, 'es')).toBe('morning');
    expect(greetingPeriod(14, 'es')).toBe('afternoon');
    expect(greetingPeriod(12, 'en')).toBe('afternoon');
  });

  test('the night greeting takes over earlier in English', () => {
    expect(greetingPeriod(19, 'en')).toBe('night');
    expect(greetingPeriod(19, 'es')).toBe('afternoon');
    expect(greetingPeriod(21, 'es')).toBe('night');
  });
});
