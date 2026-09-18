import qrcode from 'qrcode-generator';

/**
 * Level M recovers about 15% of a damaged symbol. It is what a code read off a phone screen at a
 * desk needs — glare, fingerprints and a hand that moves — without the density that L's smaller
 * symbol saves and Q or H would add.
 */
const ERROR_CORRECTION = 'M';

/** The symbol picks its own size from the length of the data. */
const AUTOMATIC_VERSION = 0;

/**
 * The silent margin the specification requires around the symbol: four modules of paper on every
 * side. Readers use it to find the edges, so it is part of the drawing rather than padding a
 * stylesheet could forget.
 */
const QUIET_ZONE = 4;

/**
 * A QR symbol as one SVG path over a square grid of `size` modules, quiet zone included. A path of
 * rectangles rather than one element per module: a code of this length is a few hundred modules,
 * and the browser draws one node instead of hundreds.
 */
export interface QrDrawing {
  readonly size: number;
  readonly path: string;
}

/**
 * Built here rather than with the library's own `createSvgTag` because that returns markup with its
 * colours and sizes baked in, which would have to be sanitised and could not take the product's own
 * ink and paper.
 */
export function qrDrawing(value: string): QrDrawing {
  const symbol = qrcode(AUTOMATIC_VERSION, ERROR_CORRECTION);

  symbol.addData(value);
  symbol.make();

  const modules = symbol.getModuleCount();
  const path: string[] = [];

  for (let row = 0; row < modules; row++) {
    for (let column = 0; column < modules; column++) {
      if (symbol.isDark(row, column)) {
        path.push(`M${column + QUIET_ZONE},${row + QUIET_ZONE}h1v1h-1z`);
      }
    }
  }

  return { size: modules + QUIET_ZONE * 2, path: path.join('') };
}
