import { ResponsiveRenderOptions } from './responsive-render-options';

interface TestOptions {
  items: string[];
  props: Record<string, any>;
  label: string;
}

// ResponsiveActionRenderOptions merges scalars only; this is the shape a consumer subclass has - a list, an
// object of props and a scalar - and it is what the merge rules below are about.
class TestRenderOptions extends ResponsiveRenderOptions<TestOptions> {
  breakpointValue() {
    return this._value;
  }

  protected cleanBreakpoint(bp?: TestOptions, defaultIfEmpty: boolean = false): TestOptions | null {
    if (!bp && !defaultIfEmpty) return null;
    return {
      items: [...(bp?.items ?? [])],
      props: { ...(bp?.props ?? {}) },
      label: bp?.label as string,
    };
  }
}

describe('ResponsiveRenderOptions', () => {
  describe('lists', () => {
    it('keeps the list it inherited when a breakpoint declares none', () => {
      const options = new TestRenderOptions({
        items: ['a', 'b'],
        props: {},
        label: 'base',
        sm: { items: [], props: { dense: true }, label: undefined as unknown as string },
      });

      expect(options.getOptionsForBreakpoint('sm').items).toEqual(['a', 'b']);
      expect(options.getOptionsForBreakpoint('sm').props).toEqual({ dense: true });
    });

    it('replaces the list when a breakpoint declares one', () => {
      const options = new TestRenderOptions({
        items: ['a', 'b'],
        props: {},
        label: 'base',
        sm: { items: ['c'], props: {}, label: undefined as unknown as string },
      });

      expect(options.getOptionsForBreakpoint('xs').items).toEqual(['a', 'b']);
      expect(options.getOptionsForBreakpoint('sm').items).toEqual(['c']);
    });

    it('cascades a list from the nearest lower breakpoint, not from the base', () => {
      const options = new TestRenderOptions({
        items: ['a', 'b'],
        props: {},
        label: 'base',
        sm: { items: ['c', 'd', 'e'], props: {}, label: undefined as unknown as string },
        md: { items: [], props: { dense: true }, label: undefined as unknown as string },
      });

      expect(options.getOptionsForBreakpoint('md').items).toEqual(['c', 'd', 'e']);
    });
  });

  describe('objects', () => {
    it('merges an object field key by key instead of replacing it', () => {
      const options = new TestRenderOptions({
        items: [],
        props: { justify: 'center', cols: 8 },
        label: 'base',
        sm: { items: [], props: { dense: true }, label: undefined as unknown as string },
      });

      expect(options.getOptionsForBreakpoint('sm').props).toEqual({ justify: 'center', cols: 8, dense: true });
    });

    it('lets a breakpoint override a single key of an inherited object', () => {
      const options = new TestRenderOptions({
        items: [],
        props: { cols: 8, offset: 2 },
        label: 'base',
        sm: { items: [], props: { cols: 12 }, label: undefined as unknown as string },
      });

      expect(options.getOptionsForBreakpoint('sm').props).toEqual({ cols: 12, offset: 2 });
    });

    it('accumulates object keys across breakpoints', () => {
      const options = new TestRenderOptions({
        items: [],
        props: { cols: 8 },
        label: 'base',
        sm: { items: [], props: { offset: 1 }, label: undefined as unknown as string },
        md: { items: [], props: { order: 3 }, label: undefined as unknown as string },
      });

      expect(options.getOptionsForBreakpoint('sm').props).toEqual({ cols: 8, offset: 1 });
      expect(options.getOptionsForBreakpoint('md').props).toEqual({ cols: 8, offset: 1, order: 3 });
    });
  });

  describe('scalars', () => {
    it('replaces a scalar and leaves it alone where the breakpoint states nothing', () => {
      const options = new TestRenderOptions({
        items: [],
        props: {},
        label: 'base',
        sm: { items: [], props: {}, label: 'small' },
        md: { items: [], props: {}, label: undefined as unknown as string },
      });

      expect(options.getOptionsForBreakpoint('xs').label).toBe('base');
      expect(options.getOptionsForBreakpoint('sm').label).toBe('small');
      expect(options.getOptionsForBreakpoint('md').label).toBe('small');
    });
  });
});
