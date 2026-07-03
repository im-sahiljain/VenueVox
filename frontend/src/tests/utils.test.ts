import { to12h, toLocalISOString } from '../lib/utils';

describe('Utility helpers: to12h', () => {
  it('converts 24-hour PM times correctly', () => {
    expect(to12h('19:00')).toBe('7:00 PM');
    expect(to12h('22:30')).toBe('10:30 PM');
    expect(to12h('12:00')).toBe('12:00 PM');
  });

  it('converts 24-hour AM times correctly', () => {
    expect(to12h('09:15')).toBe('9:15 AM');
    expect(to12h('00:00')).toBe('12:00 AM');
    expect(to12h('11:59')).toBe('11:59 AM');
  });

  it('handles empty or missing input gracefully', () => {
    expect(to12h('')).toBe('');
  });
});

describe('Utility helpers: toLocalISOString', () => {
  it('formats Date object to YYYY-MM-DD correctly without timezone shifts', () => {
    const d1 = new Date(2026, 6, 3); // July 3rd, 2026 (Note: month is 0-indexed)
    expect(toLocalISOString(d1)).toBe('2026-07-03');

    const d2 = new Date(2026, 11, 25); // Dec 25th, 2026
    expect(toLocalISOString(d2)).toBe('2026-12-25');
  });
});
