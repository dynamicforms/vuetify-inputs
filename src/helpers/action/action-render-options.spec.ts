import { ActionDisplayStyle } from './action-display-style';
import { getRenderOptionsForBreakpoint, ResponsiveActionRenderOptions } from './action-render-options';

describe('ResponsiveRenderOptions', () => {
  it('check parsing and correct breakpoint resolution', () => {
    const options = new ResponsiveActionRenderOptions({
      renderAs: 'BUTTON' as unknown as ActionDisplayStyle, // hack to still pass it as string
      showIcon: true,
      sm: { showLabel: false },
      md: {
        showIcon: false,
        showLabel: true,
      },
      xl: { renderAs: 'TEXT' as unknown as ActionDisplayStyle }, // hack to still pass it as string
    });

    expect(options.getOptionsForBreakpoint('xs')).toEqual({
      renderAs: ActionDisplayStyle.BUTTON,
      showIcon: true,
      showLabel: true,
      label: undefined,
    });

    expect(options.getOptionsForBreakpoint('sm')).toEqual({
      renderAs: ActionDisplayStyle.BUTTON,
      showIcon: true,
      showLabel: false,
      label: undefined,
    });

    expect(options.getOptionsForBreakpoint('lg')).toEqual({
      renderAs: ActionDisplayStyle.BUTTON,
      showIcon: false,
      showLabel: true,
      label: undefined,
    });
  });
  it('check correct breakpoint carry-over between breakpoints', () => {
    const options = new ResponsiveActionRenderOptions({
      renderAs: 'BUTTON' as unknown as ActionDisplayStyle, // hack to still pass it as string
      showIcon: true,
      sm: { showLabel: false },
      md: {},
      lg: {
        showIcon: false,
        showLabel: true,
      },
      xl: { renderAs: 'TEXT' as unknown as ActionDisplayStyle }, // hack to still pass it as string
    });

    // should carry-over from "global" settings
    expect(options.getOptionsForBreakpoint('xs')).toEqual({
      renderAs: ActionDisplayStyle.BUTTON,
      showIcon: true,
      showLabel: true,
      label: undefined,
    });

    // should carry-over from sm
    expect(options.getOptionsForBreakpoint('md')).toEqual({
      renderAs: ActionDisplayStyle.BUTTON,
      showIcon: true,
      showLabel: false,
      label: undefined,
    });

    // should carry-over from lg, bt also have xl-specific renderAs
    expect(options.getOptionsForBreakpoint('xl')).toEqual({
      renderAs: ActionDisplayStyle.TEXT,
      showIcon: false,
      showLabel: true,
      label: undefined,
    });
  });
});

describe('getRenderOptionsForBreakpoint', () => {
  it('answers the defaults for a value that states nothing but a label', () => {
    expect(getRenderOptionsForBreakpoint({ label: 'Save' }, 'md')).toEqual({
      name: undefined,
      label: 'Save',
      icon: undefined,
      renderAs: ActionDisplayStyle.BUTTON,
      showLabel: true,
      showIcon: false,
    });
  });

  it('draws neither a label nor an icon that is not a string', () => {
    const options = getRenderOptionsForBreakpoint({ label: { text: 'Save' }, icon: 42 }, 'md');

    expect(options.showLabel).toBe(false);
    expect(options.showIcon).toBe(false);
  });

  it('resolves the breakpoint the caller asks for', () => {
    const value = { label: 'Save', icon: 'save-outline', showLabel: true, showIcon: true, lg: { showLabel: false } };

    expect(getRenderOptionsForBreakpoint(value, 'md').label).toBe('Save');
    expect(getRenderOptionsForBreakpoint(value, 'lg').label).toBeUndefined();
    expect(getRenderOptionsForBreakpoint(value, 'lg').icon).toBe('save-outline');
  });

  it('resolves an icon a breakpoint names and the base does not', () => {
    const value = { label: 'Save', md: { icon: 'save-outline', showIcon: true } };

    expect(getRenderOptionsForBreakpoint(value, 'sm').icon).toBeUndefined();
    expect(getRenderOptionsForBreakpoint(value, 'md').icon).toBe('save-outline');
    expect(getRenderOptionsForBreakpoint(value, 'md').showIcon).toBe(true);
  });

  it('carries the members that are stated once for the action', () => {
    const value = { label: 'Save', name: 'save', defaultConfirm: true, defaultReject: false, md: { label: 'Save it' } };
    const options = getRenderOptionsForBreakpoint(value, 'md');

    expect(options.name).toBe('save');
    expect(options.defaultConfirm).toBe(true);
    expect(options.defaultReject).toBe(false);
    expect(options.label).toBe('Save it');
  });

  it('resolves passthroughAttrs key by key', () => {
    const value = {
      label: 'Save',
      passthroughAttrs: { color: 'red', density: 'compact' },
      md: { passthroughAttrs: { color: 'blue' } },
    };

    expect(getRenderOptionsForBreakpoint(value, 'sm').passthroughAttrs).toEqual({ color: 'red', density: 'compact' });
    expect(getRenderOptionsForBreakpoint(value, 'md').passthroughAttrs).toEqual({ color: 'blue', density: 'compact' });
    // the action's own object is left as it was declared
    expect(value.passthroughAttrs).toEqual({ color: 'red', density: 'compact' });
  });
});
