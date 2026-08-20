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
      const action: Action = new Action({ value: actionData });
      expect(action).toBeInstanceOf(Action);
      expect(action.label).toBe('Test action');
      expect(action.icon).toBe('test-icon');
      expect(action.renderAs).toBe(ActionDisplayStyle.BUTTON);
      expect(action.showLabel).toBe(true);
      expect(action.showIcon).toBe(true);
    });

    it('writes label and icon through the value', () => {
      const action = new Action({
        value: {
          label: 'Save',
          icon: 'save-icon',
          renderAs: ActionDisplayStyle.BUTTON,
          showLabel: true,
          showIcon: true,
        },
      });

      action.label = 'Saving';
      action.icon = 'spinner';

      expect(action.value.label).toBe('Saving');
      expect(action.value.icon).toBe('spinner');
      expect(action.label).toBe('Saving');
      expect(action.icon).toBe('spinner');
      expect(action.isChanged).toBe(true);
    });

    it('keeps the render options when label is written', () => {
      const action = new Action({
        value: { name: 'save', label: 'Save', icon: 'save-icon', renderAs: ActionDisplayStyle.TEXT, showLabel: true },
      });

      action.label = 'Saving';

      expect(action.name).toBe('save');
      expect(action.renderAs).toBe(ActionDisplayStyle.TEXT);
      expect(action.value.icon).toBe('save-icon');
    });

    it('handles showLabel/showIcon logic correctly', () => {
      const actionWithEmptyLabel = new Action({
        value: {
          label: '',
          icon: 'test-icon',
          showLabel: true,
          showIcon: true,
        },
      });
      expect(actionWithEmptyLabel.showLabel).toBe(false); // empty label means showLabel is false
      expect(actionWithEmptyLabel.showIcon).toBe(true);

      const actionWithEmptyIcon = new Action({
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
      const action = new Action({ value: actionData });

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

  describe('defaultConfirm / defaultReject / passthroughAttrs', () => {
    it('exposes defaultConfirm and defaultReject from the value', () => {
      const confirmAction = new Action({ value: { label: 'Save', defaultConfirm: true } });
      expect(confirmAction.defaultConfirm).toBe(true);
      expect(confirmAction.defaultReject).toBeUndefined();

      const rejectAction = new Action({ value: { label: 'Cancel', defaultReject: true } });
      expect(rejectAction.defaultReject).toBe(true);
      expect(rejectAction.defaultConfirm).toBeUndefined();
    });

    it('leaves defaultConfirm/defaultReject undefined when not set', () => {
      const action = new Action({ value: { label: 'Neutral' } });
      expect(action.defaultConfirm).toBeUndefined();
      expect(action.defaultReject).toBeUndefined();
    });

    it('exposes passthroughAttrs from the value', () => {
      const action = new Action({
        value: { label: 'Delete', passthroughAttrs: { color: 'error', loading: true } },
      });
      expect(action.passthroughAttrs).toEqual({ color: 'error', loading: true });
    });

    it('leaves passthroughAttrs undefined when not set', () => {
      const action = new Action({ value: { label: 'Neutral' } });
      expect(action.passthroughAttrs).toBeUndefined();
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
