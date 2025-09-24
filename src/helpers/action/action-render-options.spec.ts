import { ActionDisplayStyle } from './action-display-style';
import { ResponsiveActionRenderOptions } from './action-render-options';

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
