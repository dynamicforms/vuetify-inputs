import { ResponsiveRenderOptions } from './responsive-render-options';

class Marker {
  constructor(public text: string) {}

  get upper() {
    return this.text.toUpperCase();
  }
}

interface TestOptions {
  items?: string[];
  props?: Record<string, any>;
  label?: string;
  marker?: Marker;
}

// ResponsiveActionRenderOptions merges scalars only; this is the shape a consumer subclass has - a list, an
// object of options, a scalar and a class instance - and it is what the merge rules below are about. A field the
// breakpoint says nothing about comes back undefined, which is the contract cleanBreakpoint documents.
class TestRenderOptions extends ResponsiveRenderOptions<TestOptions> {
  protected cleanBreakpoint(bp?: TestOptions, defaultIfEmpty: boolean = false): TestOptions | null {
    if (!bp && !defaultIfEmpty) return null;
    return {
      items: bp?.items ? [...bp.items] : undefined,
      props: bp?.props ? { ...bp.props } : undefined,
      label: bp?.label,
      marker: bp?.marker,
    };
  }
}

describe('ResponsiveRenderOptions', () => {
  describe('lists', () => {
    it('keeps the list it inherited when a breakpoint states nothing about it', () => {
      const options = new TestRenderOptions({
        items: ['a', 'b'],
        sm: { props: { dense: true } },
      });

      expect(options.getOptionsForBreakpoint('sm').items).toEqual(['a', 'b']);
      expect(options.getOptionsForBreakpoint('sm').props).toEqual({ dense: true });
    });

    it('replaces the list when a breakpoint declares one', () => {
      const options = new TestRenderOptions({
        items: ['a', 'b'],
        sm: { items: ['c'] },
      });

      expect(options.getOptionsForBreakpoint('xs').items).toEqual(['a', 'b']);
      expect(options.getOptionsForBreakpoint('sm').items).toEqual(['c']);
    });

    it('empties the list when a breakpoint declares an empty one', () => {
      const options = new TestRenderOptions({
        items: ['a', 'b'],
        sm: { items: [] },
      });

      expect(options.getOptionsForBreakpoint('xs').items).toEqual(['a', 'b']);
      expect(options.getOptionsForBreakpoint('sm').items).toEqual([]);
    });

    it('cascades a list from the nearest lower breakpoint, not from the base', () => {
      const options = new TestRenderOptions({
        items: ['a', 'b'],
        sm: { items: ['c', 'd', 'e'] },
        md: { props: { dense: true } },
      });

      expect(options.getOptionsForBreakpoint('md').items).toEqual(['c', 'd', 'e']);
    });
  });

  describe('objects', () => {
    it('merges a plain object field key by key instead of replacing it', () => {
      const options = new TestRenderOptions({
        props: { justify: 'center', cols: 8 },
        sm: { props: { dense: true } },
      });

      expect(options.getOptionsForBreakpoint('sm').props).toEqual({ justify: 'center', cols: 8, dense: true });
    });

    it('lets a breakpoint override a single key of an inherited object', () => {
      const options = new TestRenderOptions({
        props: { cols: 8, offset: 2 },
        sm: { props: { cols: 12 } },
      });

      expect(options.getOptionsForBreakpoint('sm').props).toEqual({ cols: 12, offset: 2 });
    });

    it('accumulates object keys across breakpoints', () => {
      const options = new TestRenderOptions({
        props: { cols: 8 },
        sm: { props: { offset: 1 } },
        md: { props: { order: 3 } },
      });

      expect(options.getOptionsForBreakpoint('sm').props).toEqual({ cols: 8, offset: 1 });
      expect(options.getOptionsForBreakpoint('md').props).toEqual({ cols: 8, offset: 1, order: 3 });
    });

    it('merges shallowly - a nested object is replaced whole', () => {
      const options = new TestRenderOptions({
        props: { style: { color: 'red', margin: 10 }, cols: 8 },
        sm: { props: { style: { color: 'blue' } } },
      });

      expect(options.getOptionsForBreakpoint('sm').props).toEqual({ style: { color: 'blue' }, cols: 8 });
    });

    it('replaces a class instance rather than spreading it', () => {
      const base = new Marker('base');
      const small = new Marker('small');
      const options = new TestRenderOptions({ marker: base, sm: { marker: small } });

      expect(options.getOptionsForBreakpoint('xs').marker).toBe(base);

      const merged = options.getOptionsForBreakpoint('sm').marker;
      expect(merged).toBe(small);
      expect(merged).toBeInstanceOf(Marker);
      expect(merged!.upper).toBe('SMALL');
    });
  });

  describe('scalars', () => {
    it('replaces a scalar and leaves it alone where the breakpoint states nothing', () => {
      const options = new TestRenderOptions({
        label: 'base',
        sm: { label: 'small' },
        md: { props: { dense: true } },
      });

      expect(options.getOptionsForBreakpoint('xs').label).toBe('base');
      expect(options.getOptionsForBreakpoint('sm').label).toBe('small');
      expect(options.getOptionsForBreakpoint('md').label).toBe('small');
    });
  });
});
