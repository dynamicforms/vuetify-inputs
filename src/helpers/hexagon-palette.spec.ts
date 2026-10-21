import { describe, expect, it } from 'vitest';

import {
  hexagonCells,
  hexagonPoints,
  hexToOkLab,
  hexToRgb,
  isInGamut,
  maxChromaInGamut,
  nearestCell,
  nearestLevel,
  okLabToHex,
  okLabToOkLch,
  okLchToOkLab,
  rgbToHex,
} from './hexagon-palette';

describe('hex and sRGB', () => {
  it.each([
    ['#f00', [1, 0, 0]],
    ['0f0', [0, 1, 0]],
    ['#0000ff', [0, 0, 1]],
    ['#ffffff80', [1, 1, 1]],
  ])('reads %s', (hex, rgb) => {
    expect(hexToRgb(hex)).toEqual(rgb);
  });

  it('reads no color from a string that is not hex', () => {
    expect(hexToRgb('red')).toBeNull();
    expect(hexToOkLab('#12345')).toBeNull();
  });

  it('writes #rrggbb, clamped', () => {
    expect(rgbToHex([1, 0.5, 0])).toBe('#ff8000');
    expect(rgbToHex([1.2, -0.1, 0])).toBe('#ff0000');
  });
});

describe('OKLab and OKLCH', () => {
  it('maps white, black and red to their reference coordinates', () => {
    expect(hexToOkLab('#ffffff')!.L).toBeCloseTo(1, 4);
    expect(hexToOkLab('#000000')!.L).toBeCloseTo(0, 6);
    const red = okLabToOkLch(hexToOkLab('#ff0000')!);
    expect(red.L).toBeCloseTo(0.628, 3);
    expect(red.C).toBeCloseTo(0.2577, 3);
    expect(red.h).toBeCloseTo(29.23, 1);
  });

  it.each(['#336699', '#ff8000', '#00ffaa', '#123456', '#808080'])('round-trips %s', (hex) => {
    const lch = okLabToOkLch(hexToOkLab(hex)!);
    expect(okLabToHex(okLchToOkLab(lch))).toBe(hex);
  });

  it('gives a grey no chroma', () => {
    expect(okLabToOkLch(hexToOkLab('#808080')!).C).toBeCloseTo(0, 4);
  });
});

describe('maxChromaInGamut', () => {
  it.each([
    [0.45, 0],
    [0.6, 140],
    [0.75, 260],
    [0.6, 330],
  ])('at L %s and hue %s is in sRGB, and a higher chroma is not', (L, h) => {
    const C = maxChromaInGamut(L, h);
    expect(C).toBeGreaterThan(0);
    expect(isInGamut({ L, C, h })).toBe(true);
    expect(isInGamut({ L, C: C + 0.002, h })).toBe(false);
  });
});

describe('hexagonCells', () => {
  it.each([
    [1, 1],
    [3, 19],
    [4, 37],
    [5, 61],
  ])('lays out %s rings as %s cells', (rings, count) => {
    expect(hexagonCells(rings, 0.6)).toHaveLength(count);
  });

  it('puts the grey of the level in the centre', () => {
    const [centre] = hexagonCells(5, 0.6);
    const lab = hexToOkLab(centre.color)!;
    expect([centre.x, centre.y, centre.ring]).toEqual([0, 0, 0]);
    expect(lab.L).toBeCloseTo(0.6, 2);
    expect(Math.hypot(lab.a, lab.b)).toBeLessThan(0.002);
  });

  it('gives ring r 6·r cells, each 1 from its predecessor and r from the centre in hexagon distance', () => {
    const cells = hexagonCells(5, 0.6);
    [1, 2, 3, 4].forEach((ring) => {
      const ringCells = cells.filter((cell) => cell.ring === ring);
      expect(ringCells).toHaveLength(6 * ring);
      ringCells.forEach((cell, i) => {
        const next = ringCells[(i + 1) % ringCells.length];
        expect(Math.hypot(next.x - cell.x, next.y - cell.y)).toBeCloseTo(1, 6);
      });
    });
    const positions = new Set(cells.map((cell) => `${cell.x.toFixed(3)},${cell.y.toFixed(3)}`));
    expect(positions.size).toBe(cells.length);
  });

  it('starts each ring up and to the left of the centre with the hue 0', () => {
    const first = hexagonCells(3, 0.6).find((cell) => cell.ring === 2)!;
    expect(first.x).toBeCloseTo(-1, 6);
    expect(first.y).toBeCloseTo(-Math.sqrt(3), 6);
    const { h } = okLabToOkLch(hexToOkLab(first.color)!);
    expect(Math.cos((h * Math.PI) / 180)).toBeCloseTo(1, 2);
  });

  it('gives the outer ring the largest chroma of its hue in sRGB at the level', () => {
    const L = 0.6;
    const outer = hexagonCells(5, L).filter((cell) => cell.ring === 4);
    outer.forEach((cell, i) => {
      const h = (i / outer.length) * 360;
      const lch = okLabToOkLch(hexToOkLab(cell.color)!);
      // the 8-bit rounding of the cell's color moves it by less than 0.01 in chroma
      expect(lch.C).toBeCloseTo(maxChromaInGamut(L, h), 1);
      expect(Math.abs(lch.C - maxChromaInGamut(L, h))).toBeLessThan(0.01);
      expect(isInGamut({ L, C: maxChromaInGamut(L, h) + 0.002, h })).toBe(false);
    });
  });

  it('gives an inner ring a proportional chroma', () => {
    const L = 0.6;
    const cells = hexagonCells(5, L);
    const ring2 = cells.filter((cell) => cell.ring === 2)[0];
    expect(okLabToOkLch(hexToOkLab(ring2.color)!).C).toBeCloseTo((2 / 4) * maxChromaInGamut(L, 0), 2);
  });
});

describe('hexagonPoints', () => {
  it('draws a pointy-top hexagon', () => {
    const points = hexagonPoints(0, 0, 1)
      .split(' ')
      .map((point) => point.split(',').map(Number));
    expect(points).toHaveLength(6);
    expect(points.some(([x, y]) => Math.abs(x) < 1e-3 && Math.abs(y + 1) < 1e-3)).toBe(true);
    expect(points.some(([x, y]) => Math.abs(x) < 1e-3 && Math.abs(y - 1) < 1e-3)).toBe(true);
  });
});

describe('nearestCell and nearestLevel', () => {
  const cells = hexagonCells(5, 0.6);

  it('finds a cell by its own color', () => {
    expect(nearestCell(cells, cells[17].color)).toBe(cells[17]);
  });

  it('finds the grey centre for a grey', () => {
    expect(nearestCell(cells, '#7f7f7f')).toBe(cells[0]);
  });

  it('finds the nearest cell by OKLab distance', () => {
    const target = hexToOkLab('#ff0000')!;
    const found = nearestCell(cells, '#ff0000')!;
    const distance = (hex: string) => {
      const lab = hexToOkLab(hex)!;
      return Math.hypot(lab.L - target.L, lab.a - target.a, lab.b - target.b);
    };
    cells.forEach((cell) => expect(distance(found.color)).toBeLessThanOrEqual(distance(cell.color)));
  });

  it('finds no cell for a value that is not a hex color', () => {
    expect(nearestCell(cells, 'red')).toBeUndefined();
    expect(nearestCell(cells, null)).toBeUndefined();
  });

  it('finds the level nearest to the lightness of the color', () => {
    expect(nearestLevel([0.45, 0.6, 0.75], '#000000')).toBe(0);
    expect(nearestLevel([0.45, 0.6, 0.75], '#ffffff')).toBe(2);
    expect(nearestLevel([0.45, 0.6, 0.75], okLabToHex({ L: 0.62, a: 0, b: 0 }))).toBe(1);
    expect(nearestLevel([0.45, 0.6, 0.75], 'nope')).toBe(0);
  });
});
