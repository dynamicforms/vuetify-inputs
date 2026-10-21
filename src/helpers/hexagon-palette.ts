/** A color in OKLab: lightness `L` (0..1) and the opponent axes `a` and `b`. */
export interface OkLab {
  L: number;
  a: number;
  b: number;
}

/** A color in OKLCH: lightness `L` (0..1), chroma `C` and hue `h` in degrees. */
export interface OkLch {
  L: number;
  C: number;
  h: number;
}

/** One cell of the hexagon palette. */
export interface HexagonCell {
  /** 0 for the centre, then ring by ring as the cells are laid out. */
  index: number;
  /** 0 for the centre. */
  ring: number;
  /** Position of the cell's centre; neighbouring cells are 1 apart. */
  x: number;
  y: number;
  /** `#rrggbb` */
  color: string;
}

/** The distance from a cell's centre to its corners, with neighbouring centres 1 apart. */
export const hexagonCellRadius = 1 / Math.sqrt(3);

// a linear channel this far outside 0..1 still counts as inside sRGB: it rounds to the same 8-bit value
const gamutTolerance = 1e-6;

/** The sRGB channels (0..1) of `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa`, with or without `#`; alpha is ignored. */
export function hexToRgb(hex: string): [number, number, number] | null {
  let digits = hex.replace(/^#/, '');
  if (!/^([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(digits)) return null;
  if (digits.length <= 4) digits = [...digits].map((digit) => digit + digit).join('');
  return [0, 2, 4].map((start) => parseInt(digits.slice(start, start + 2), 16) / 255) as [number, number, number];
}

/** `#rrggbb` of sRGB channels (0..1), clamped to 0..1. */
export function rgbToHex(rgb: [number, number, number]): string {
  const byte = (channel: number) =>
    Math.round(Math.min(1, Math.max(0, channel)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${rgb.map(byte).join('')}`;
}

const toLinear = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
const fromLinear = (channel: number) => (channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055);

function linearToOkLab([r, g, b]: [number, number, number]): OkLab {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function okLabToLinear({ L, a, b }: OkLab): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** The OKLab coordinates of a hex color; `null` for a string that is not one. */
export function hexToOkLab(hex: string): OkLab | null {
  const rgb = hexToRgb(hex);
  return rgb ? linearToOkLab(rgb.map(toLinear) as [number, number, number]) : null;
}

/** `#rrggbb` of an OKLab color; channels outside sRGB are clamped. */
export function okLabToHex(lab: OkLab): string {
  return rgbToHex(okLabToLinear(lab).map(fromLinear) as [number, number, number]);
}

export function okLabToOkLch({ L, a, b }: OkLab): OkLch {
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return { L, C: Math.hypot(a, b), h: h < 0 ? h + 360 : h };
}

export function okLchToOkLab({ L, C, h }: OkLch): OkLab {
  const rad = (h * Math.PI) / 180;
  return { L, a: C * Math.cos(rad), b: C * Math.sin(rad) };
}

/** Whether an OKLCH color lies inside sRGB. */
export function isInGamut(lch: OkLch): boolean {
  return okLabToLinear(okLchToOkLab(lch)).every(
    (channel) => channel >= -gamutTolerance && channel <= 1 + gamutTolerance,
  );
}

/** The largest chroma that hue `h` has inside sRGB at lightness `L`, found by binary search. */
export function maxChromaInGamut(L: number, h: number): number {
  let low = 0;
  let high = 0.5;
  for (let step = 0; step < 32; step++) {
    const mid = (low + high) / 2;
    if (isInGamut({ L, C: mid, h })) low = mid;
    else high = mid;
  }
  return low;
}

const directionX = (degrees: number) => Math.cos((degrees * Math.PI) / 180);
const directionY = (degrees: number) => Math.sin((degrees * Math.PI) / 180);

/**
 * The cells of a hexagon palette of `rings` rings, the centre counted as the first: `1 + 3·rings·(rings − 1)` cells.
 * The centre is the grey of lightness `L`. Ring `r` holds `6·r` cells: it starts `r` cells up and to the left of the
 * centre and runs clockwise along six sides of `r` cells. Cell `i` of side `a` has the hue `(a + i/r) / 6` of a full
 * turn and the chroma `r / (rings − 1)` of the largest chroma that hue has inside sRGB at `L`, so the outer ring holds
 * the most saturated color of each hue. `y` grows downwards, as in SVG; the cells are pointy-top hexagons.
 */
export function hexagonCells(rings: number, L: number): HexagonCell[] {
  const cells: HexagonCell[] = [{ index: 0, ring: 0, x: 0, y: 0, color: okLabToHex({ L, a: 0, b: 0 }) }];
  for (let ring = 1; ring < rings; ring++) {
    let x = ring * directionX(-120);
    let y = ring * directionY(-120);
    for (let side = 0; side < 6; side++) {
      for (let i = 0; i < ring; i++) {
        const h = ((side + i / ring) / 6) * 360;
        const C = (ring / (rings - 1)) * maxChromaInGamut(L, h);
        cells.push({ index: cells.length, ring, x, y, color: okLabToHex(okLchToOkLab({ L, C, h })) });
        x += directionX(side * 60);
        y += directionY(side * 60);
      }
    }
  }
  return cells;
}

/** The corners of a pointy-top hexagon cell centred at (`x`, `y`), as an SVG `points` attribute. */
export function hexagonPoints(x: number, y: number, radius = hexagonCellRadius): string {
  return [0, 1, 2, 3, 4, 5]
    .map((corner) => {
      const degrees = -30 + corner * 60;
      return `${(x + radius * directionX(degrees)).toFixed(4)},${(y + radius * directionY(degrees)).toFixed(4)}`;
    })
    .join(' ');
}

const okLabDistance = (one: OkLab, other: OkLab) => Math.hypot(one.L - other.L, one.a - other.a, one.b - other.b);

/** The cell nearest to the hex color `color` by OKLab distance; `undefined` for a value that is not a hex color. */
export function nearestCell(cells: HexagonCell[], color: string | null | undefined): HexagonCell | undefined {
  const target = color ? hexToOkLab(color) : null;
  if (!target) return undefined;
  let nearest: HexagonCell | undefined;
  let nearestDistance = Infinity;
  cells.forEach((cell) => {
    const distance = okLabDistance(hexToOkLab(cell.color)!, target);
    if (distance < nearestDistance) {
      nearest = cell;
      nearestDistance = distance;
    }
  });
  return nearest;
}

/** The index of the level in `levels` nearest to the OKLab lightness of `color`; 0 for a non-hex `color`. */
export function nearestLevel(levels: number[], color: string | null | undefined): number {
  const target = color ? hexToOkLab(color) : null;
  if (!target) return 0;
  return levels.reduce(
    (best, level, index) => (Math.abs(level - target.L) < Math.abs(levels[best] - target.L) ? index : best),
    0,
  );
}
