import { ref } from 'vue';

import { translateStrings } from '../translations';

import { Action } from './action';
import { BreakpointNames } from './responsive-render-options';

describe('Action', () => {
  describe('Action class', () => {
    it('creates an action with basic value properties', () => {
      const actionData = {
        label: 'Test action',
        icon: 'test-icon',
        renderAs: 'button' as const,
        showLabel: true,
        showIcon: true,
      };
      const action: Action = new Action({ value: actionData });
      expect(action).toBeInstanceOf(Action);
      expect(action.label).toBe('Test action');
      expect(action.icon).toBe('test-icon');
      expect(action.renderAs).toBe('button');
      expect(action.showLabel).toBe(true);
      expect(action.showIcon).toBe(true);
    });

    it('writes label and icon through the value', () => {
      const action = new Action({
        value: {
          label: 'Save',
          icon: 'save-icon',
          renderAs: 'button' as const,
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
        value: { name: 'save', label: 'Save', icon: 'save-icon', renderAs: 'text' as const, showLabel: true },
      });

      action.label = 'Saving';

      expect(action.name).toBe('save');
      expect(action.renderAs).toBe('text');
      expect(action.value.icon).toBe('save-icon');
    });

    it('reads the label and the icon whatever the flags say', () => {
      const action = new Action({ value: { name: 'save', label: 'Save', icon: 'save-icon' } });

      expect(action.label).toBe('Save');
      expect(action.icon).toBe('save-icon');
    });

    it('renders the label and the icon only where the flags state they are shown', () => {
      const action = new Action({
        value: { name: 'save', label: 'Save', icon: 'save-icon', showLabel: false, showIcon: true },
      });

      expect(action.renderedLabel).toBeUndefined();
      expect(action.renderedIcon).toBe('save-icon');
      expect(action.label).toBe('Save');
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
        renderAs: 'button' as const,
        showLabel: false,
        showIcon: true,
        md: { showLabel: true, showIcon: false },
        xl: { renderAs: 'text' as const },
      };
      const action = new Action({ value: actionData });

      const breakpointValue = action.getBreakpointValue(breakpoint);

      expect(breakpointValue.value.label).toBe('Test action');
      expect(breakpointValue.value.icon).toBeUndefined(); // showIcon is false for md
      expect(breakpointValue.value.showLabel).toBe(true); // overridden for md
      expect(breakpointValue.value.showIcon).toBe(false); // overridden for md
      expect(breakpointValue.value.renderAs).toBe('button');

      // Test reactivity - change breakpoint
      breakpoint.value = 'xl';
      expect(breakpointValue.value.renderAs).toBe('text'); // overridden for xl
    });
  });

  describe('defaultConfirm / defaultReject / passthroughAttrs', () => {
    it('exposes defaultConfirm and defaultReject from the value', () => {
      const confirmAction = new Action({ value: { label: 'Save', defaultConfirm: true } });
      expect(confirmAction.defaultConfirm).toBe(true);
      expect(confirmAction.defaultReject).toBe(false);

      const rejectAction = new Action({ value: { label: 'Cancel', defaultReject: true } });
      expect(rejectAction.defaultReject).toBe(true);
      expect(rejectAction.defaultConfirm).toBe(false);
    });

    it('answers false for defaultConfirm/defaultReject when not set', () => {
      const action = new Action({ value: { label: 'Neutral' } });
      expect(action.defaultConfirm).toBe(false);
      expect(action.defaultReject).toBe(false);
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
      expect(action.renderAs).toBe('button');
    });

    it('yesAction() should return an Action object with correct values', () => {
      const action = Action.yesAction();
      expect(action).toBeInstanceOf(Action);
      expect(action.label).toBe('Yes');
      expect(action.icon).toBe('ion-thumbs-up-outline');
      expect(action.renderAs).toBe('button');
    });

    it('noAction() should return an Action object with correct values', () => {
      const action = Action.noAction();
      expect(action).toBeInstanceOf(Action);
      expect(action.label).toBe('No');
      expect(action.icon).toBe('ion-thumbs-down-outline');
      expect(action.renderAs).toBe('button');
    });

    it('saveAction() should return an Action object with correct values', () => {
      const action = Action.saveAction();
      expect(action).toBeInstanceOf(Action);
      expect(action.name).toBe('save');
      expect(action.label).toBe('Save');
      expect(action.icon).toBe('ion-save-outline');
      expect(action.renderAs).toBe('button');
    });

    it('cancelAction() should return an Action object with correct values', () => {
      const action = Action.cancelAction();
      expect(action).toBeInstanceOf(Action);
      expect(action.name).toBe('cancel');
      expect(action.label).toBe('Cancel');
      expect(action.icon).toBe('ion-close-circle-outline');
      expect(action.renderAs).toBe('button');
    });

    it('labels save and cancel in the current translation', () => {
      translateStrings((key) => ({ Save: 'Shrani', Cancel: 'Prekliči' })[key] ?? key);
      expect(Action.saveAction().label).toBe('Shrani');
      expect(Action.cancelAction({ value: { defaultReject: true } }).label).toBe('Prekliči');
      translateStrings((key) => key);
    });

    it('labels a template action in the current translation', () => {
      const locale = ref('en');
      translateStrings((key) => (locale.value === 'sl' && key === 'Close' ? 'Zapri' : key));
      const action = Action.closeAction();
      const options = action.getBreakpointValue(ref<BreakpointNames>('xs'));

      locale.value = 'sl';

      expect(action.label).toBe('Zapri');
      expect(options.value.label).toBe('Zapri');
      translateStrings((key) => key);
    });

    it('template functions accept override data', () => {
      const customData = {
        value: {
          label: 'Custom Close',
          renderAs: 'text' as const,
        },
      };
      const action = Action.closeAction(customData);

      expect(action.label).toBe('Custom Close');
      expect(action.icon).toBe('ion-close-outline'); // should keep default icon
      expect(action.renderAs).toBe('text'); // should use override
    });
  });
});
