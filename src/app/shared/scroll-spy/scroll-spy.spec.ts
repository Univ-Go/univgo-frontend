import { activeSection } from './scroll-spy';

describe('activeSection', () => {
  const order = ['closures', 'identity', 'usage'];

  it('picks the section that has just come into the band over the tail of the one before it', () => {
    expect(activeSection(order, new Set(['identity', 'closures']), null)).toBe('identity');
  });

  it('decides by page order, not by the order the sections became visible', () => {
    expect(activeSection(order, new Set(['usage', 'closures']), null)).toBe('usage');
  });

  it('keeps the previous answer while no section is in the reading band', () => {
    expect(activeSection(order, new Set(), 'usage')).toBe('usage');
  });

  it('ignores a visible id that is not one of the sections', () => {
    expect(activeSection(order, new Set(['elsewhere']), 'closures')).toBe('closures');
  });

  it('answers nothing before any section has been seen', () => {
    expect(activeSection(order, new Set(), null)).toBeNull();
  });
});
