import { ref } from 'vue';

import { Action } from './action';
import { ActionDisplayStyle } from './action-display-style';
import { BreakpointNames } from './responsive-render-options';

describe('Action', () => {
  describe('Action class', () => {
    it('creates an action with basic value properties', () => {
      const actionData = {
        label: 'Test action',
        icon: 'test-icon',
        renderAs: ActionDisplayStyle.BUTTON,
        showLabel: true,
        showIcon: true,
      };
      const action: Action = Action.create({ value: actionData });
      expect(action).toBeInstanceOf(Action);
      expect(action.label).toBe('Test action');
      expect(action.icon).toBe('test-icon');
      expect(action.renderAs).toBe(ActionDisplayStyle.BUTTON);
      expect(action.showLabel).toBe(true);
      expect(action.showIcon).toBe(true);
    });

    it('handles showLabel/showIcon logic correctly', () => {
      const actionWithEmptyLabel = Action.create({
        value: {
          label: '',
          icon: 'test-icon',
          showLabel: true,
          showIcon: true,
        },
      });
      expect(actionWithEmptyLabel.showLabel).toBe(false); // empty label means showLabel is false
      expect(actionWithEmptyLabel.showIcon).toBe(true);

      const actionWithEmptyIcon = Action.create({
        value: {
          label: 'Test',
          icon: '',
          showLabel: true,
          showIcon: true,
        },
      });
      expect(actionWithEmptyIcon.showLabel).toBe(true);
      expect(actionWithEmptyIcon.showIcon).toBe(false); // empty icon means showIcon is false
    });
  });

  describe('getBreakpointValue method', () => {
    it('returns computed with responsive values', () => {
      const breakpoint = ref('md' as BreakpointNames);
      const actionData = {
        label: 'Test action',
        icon: 'test-icon',
        renderAs: ActionDisplayStyle.BUTTON,
        showLabel: false,
        showIcon: true,
        md: { showLabel: true, showIcon: false },
        xl: { renderAs: ActionDisplayStyle.TEXT },
      };
      const action = Action.create({ value: actionData });

      const breakpointValue = action.getBreakpointValue(breakpoint);

      expect(breakpointValue.value.label).toBe('Test action');
      expect(breakpointValue.value.icon).toBeUndefined(); // showIcon is false for md
      expect(breakpointValue.value.showLabel).toBe(true); // overridden for md
      expect(breakpointValue.value.showIcon).toBe(false); // overridden for md
      expect(breakpointValue.value.renderAs).toBe(ActionDisplayStyle.BUTTON);

      // Test reactivity - change breakpoint
      breakpoint.value = 'xl';
      expect(breakpointValue.value.renderAs).toBe(ActionDisplayStyle.TEXT); // overridden for xl
    });
  });

  describe('Action template functions', () => {
    it('closeAction() should return an Action object with correct values', () => {
      const action = Action.closeAction();
      expect(action).toBeInstanceOf(Action);
      expect(action.label).toBe('Close');
      expect(action.icon).toBe('ion-close-outline');
      expect(action.renderAs).toBe(ActionDisplayStyle.BUTTON);
    });

    it('yesAction() should return an Action object with correct values', () => {
      const action = Action.yesAction();
      expect(action).toBeInstanceOf(Action);
      expect(action.label).toBe('Yes');
      expect(action.icon).toBe('ion-thumbs-up-outline');
      expect(action.renderAs).toBe(ActionDisplayStyle.BUTTON);
    });

    it('noAction() should return an Action object with correct values', () => {
      const action = Action.noAction();
      expect(action).toBeInstanceOf(Action);
      expect(action.label).toBe('No');
      expect(action.icon).toBe('ion-thumbs-down-outline');
      expect(action.renderAs).toBe(ActionDisplayStyle.BUTTON);
    });

    it('template functions accept override data', () => {
      const customData = {
        value: {
          label: 'Custom Close',
          renderAs: ActionDisplayStyle.TEXT,
        },
      };
      const action = Action.closeAction(customData);

      expect(action.label).toBe('Custom Close');
      expect(action.icon).toBe('ion-close-outline'); // should keep default icon
      expect(action.renderAs).toBe(ActionDisplayStyle.TEXT); // should use override
    });
  });
});
