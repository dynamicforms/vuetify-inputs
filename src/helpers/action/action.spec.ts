import { Action as FormAction } from '@dynamicforms/vue-forms';
import { vi } from 'vitest';

import { Action, ActionJSON } from './action';
import { ActionDisplayStyle } from './action-display-style';
import ResponsiveRenderOptions from './responsive-render-options';

describe('Action', () => {
  describe('Action class', () => {
    it('creates an action with the expected properties', () => {
      const actionData: ActionJSON = {
        name: 'test-action',
        label: 'Test action',
        icon: 'test-icon',
        displayStyle: {
          xl: { showLabel: true, showIcon: true, renderAs: 'TEXT' as unknown as ActionDisplayStyle },
          sm: { showLabel: false, showIcon: false, renderAs: 'BUTTON' as unknown as ActionDisplayStyle },
        },
      };
      const action = new Action(actionData, FormAction.create());

      expect(action).toHaveProperty('name', 'test-action');
      expect(action).toHaveProperty('label', 'Test action');
      expect(action).toHaveProperty('labelAvailable', true);
      expect(action).toHaveProperty('icon', 'test-icon');
      expect(action).toHaveProperty('iconAvailable', true);
      expect(action).toHaveProperty('displayStyle', new ResponsiveRenderOptions({
        label: 'Test action',
        xl: { showLabel: true, showIcon: true, renderAs: ActionDisplayStyle.TEXT },
        sm: { showLabel: false, showIcon: false, renderAs: ActionDisplayStyle.BUTTON },
      }));
      expect(action).toHaveProperty('formAction');
    });

    it('does not throw an error if the name matches the pattern', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
      const actionData = { name: 'valid-name' };
      new Action(actionData, FormAction.create()); // eslint-disable-line no-new
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Action template functions', () => {
    it('actionClose() should return an Action object with correct values', () => {
      const action = Action.closeAction({}, FormAction.create());
      expect(action).toBeInstanceOf(Action);
      expect(action).toHaveProperty('name', 'close');
      expect(action).toHaveProperty('label', 'Close');
      expect(action).toHaveProperty('labelAvailable', true);
      expect(action).toHaveProperty('icon', 'close-outline');
      expect(action).toHaveProperty('iconAvailable', true);
    });

    it('actionYes() should return an Action object with correct values', () => {
      const action = Action.yesAction({}, FormAction.create());
      expect(action).toBeInstanceOf(Action);
      expect(action).toHaveProperty('name', 'yes');
      expect(action).toHaveProperty('label', 'Yes');
      expect(action).toHaveProperty('labelAvailable', true);
      expect(action).toHaveProperty('icon', 'thumbs-up-outline');
      expect(action).toHaveProperty('iconAvailable', true);
    });

    it('actionNo() should return an Action object with correct values', () => {
      const action = Action.noAction({}, FormAction.create());
      expect(action).toBeInstanceOf(Action);
      expect(action).toHaveProperty('name', 'no');
      expect(action).toHaveProperty('label', 'No');
      expect(action).toHaveProperty('labelAvailable', true);
      expect(action).toHaveProperty('icon', 'thumbs-down-outline');
      expect(action).toHaveProperty('iconAvailable', true);
    });
  });
});
