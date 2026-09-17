import { qrDrawing } from './qr-matrix';

const CODE = 'a0f3c1d2-1111-2222-3333-444455556666';

describe('qrDrawing', () => {
  it('draws a square grid with the quiet zone the specification requires', () => {
    const drawing = qrDrawing(CODE);

    // Version 1 is 21 modules; whichever version the data needs, the eight modules of silence are
    // always on top of it.
    expect(drawing.size).toBeGreaterThanOrEqual(21 + 8);
  });

  it('keeps every module inside the grid, margin included', () => {
    const drawing = qrDrawing(CODE);
    const coordinates = [...drawing.path.matchAll(/M(\d+),(\d+)/g)];

    expect(coordinates.length).toBeGreaterThan(0);

    for (const [, column, row] of coordinates) {
      expect(Number(column)).toBeGreaterThanOrEqual(4);
      expect(Number(row)).toBeGreaterThanOrEqual(4);
      expect(Number(column)).toBeLessThan(drawing.size - 4);
      expect(Number(row)).toBeLessThan(drawing.size - 4);
    }
  });

  it('answers the same drawing for the same code, which is what makes a pass a pass', () => {
    expect(qrDrawing(CODE)).toEqual(qrDrawing(CODE));
  });

  it('answers a different drawing for a different code', () => {
    expect(qrDrawing(CODE).path).not.toEqual(qrDrawing('another-code').path);
  });

  it('grows the symbol rather than truncating what does not fit', () => {
    const short = qrDrawing('UG-4F7K');
    const long = qrDrawing(CODE.repeat(4));

    expect(long.size).toBeGreaterThan(short.size);
  });
});
