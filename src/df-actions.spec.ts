import { Action as FormAction, ExecuteAction, Field, Group, SubmitAction, Validators } from '@dynamicforms/vue-forms';
import { flushPromises, mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { nextTick, Ref, ref } from 'vue';
import { CachedIcon } from 'vue-cached-icon';
import { VBtn } from 'vuetify/components';

import DfActions from '@/df-actions.vue';
import { Action, HtmlString } from '@/helpers';

describe('DfActions', () => {
  const createMockAction = (name: string, label: string, icon?: string): Action => {
    const executeAction = new ExecuteAction(vi.fn());
    return new Action({
      value: {
        name,
        label,
        icon,
        renderAs: 'button',
        showLabel: true,
        showIcon: !!icon,
      },
      actions: [executeAction],
    });
  };

  it('renders one button per action', () => {
    const actions = [
      createMockAction('save', 'Save', 'save-outline'),
      createMockAction('cancel', 'Cancel', 'close-outline'),
    ];

    const wrapper = mount(DfActions, {
      props: { actions },
    });

    expect(wrapper.findAll('.v-btn')).toHaveLength(2);
  });

  it('shows the label and the icon', () => {
    const actions = [createMockAction('save', 'Save', 'save-outline')];

    const wrapper = mount(DfActions, {
      props: { actions },
    });

    const button = wrapper.find('.v-btn');
    expect(button.text()).toContain('Save');
    expect(button.find('[data-icon="save-outline"]')).toBeTruthy();
  });

  it('calls execute on click', async () => {
    const mockExecute = vi.fn();
    const action = createMockAction('save', 'Save');
    action.execute = mockExecute;

    const wrapper = mount(DfActions, {
      props: { actions: [action] },
    });

    await wrapper.find('.v-btn').trigger('click');
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('renders nothing without actions', () => {
    const wrapper = mount(DfActions, {
      props: { actions: [] },
    });

    expect(wrapper.find('.v-btn').exists()).toBe(false);
  });

  it('uses the button-group class when showAsGroup is set', () => {
    const actions = [createMockAction('save', 'Save')];

    const wrapper = mount(DfActions, {
      props: { actions, showAsGroup: 'grouped' },
    });

    expect(wrapper.find('.button-group').exists()).toBe(true);
    expect(wrapper.find('.with-border').exists()).toBe(true);
  });

  it('sets the button size', () => {
    const actions = [createMockAction('save', 'Save')];

    const wrapper = mount(DfActions, {
      props: { actions, buttonSize: 'large' },
    });

    const buttonComponent = wrapper.findComponent({ name: 'v-btn' });
    expect(buttonComponent.props('size')).toBe('large');
  });
  it('renders the button as the text variant', () => {
    const action = createMockAction('save', 'Save');
    action.value.renderAs = 'text';

    const wrapper = mount(DfActions, {
      props: { actions: [action] },
      global: {
        stubs: {
          'v-btn': {
            template: '<button class="v-btn" :data-variant="variant"><slot /></button>',
            props: ['variant', 'size', 'elevation', 'class'],
          },
        },
      },
    });

    const button = wrapper.find('.v-btn');
    expect(button.attributes('data-variant')).toBe('text');
  });

  it('shows a spacer between the icon and the label', () => {
    const action = createMockAction('save', 'Save', 'save-outline');

    const wrapper = mount(DfActions, {
      props: { actions: [action] },
    });

    const spacer = wrapper.find('span[style*="width: 0.5rem"]');
    expect(spacer.exists()).toBe(true);
  });

  it('shows no spacer without an icon or a label', () => {
    const actionOnlyIcon = createMockAction('save', '', 'save-outline');

    const wrapper = mount(DfActions, {
      props: { actions: [actionOnlyIcon] },
    });

    const spacer = wrapper.find('span[style*="width: .5rem"]');
    expect(spacer.exists()).toBe(false);
  });

  it('sets the grouping CSS classes', () => {
    const actions = [createMockAction('save', 'Save')];

    const wrapper = mount(DfActions, {
      props: { actions, showAsGroup: 'grouped-no-borders' },
    });

    const container = wrapper.find('div');
    expect(container.classes()).toContain('button-group');
    expect(container.classes()).not.toContain('with-border');
  });
  it('follows changes to the actions prop', async () => {
    const initialActions = [createMockAction('save', 'Save')];

    const wrapper = mount(DfActions, {
      props: { actions: initialActions },
    });

    expect(wrapper.findAll('.v-btn')).toHaveLength(1);

    const newActions = [...initialActions, createMockAction('delete', 'Delete', 'trash-outline')];

    await wrapper.setProps({ actions: newActions });

    expect(wrapper.findAll('.v-btn')).toHaveLength(2);

    const buttons = wrapper.findAll('.v-btn');
    expect(buttons[0].text()).toContain('Save');
    expect(buttons[1].text()).toContain('Delete');
  });

  it('follows removed actions', async () => {
    const initialActions = [
      createMockAction('save', 'Save'),
      createMockAction('delete', 'Delete'),
      createMockAction('cancel', 'Cancel'),
    ];

    const wrapper = mount(DfActions, {
      props: { actions: initialActions },
    });

    expect(wrapper.findAll('.v-btn')).toHaveLength(3);

    await wrapper.setProps({ actions: initialActions.slice(0, 2) });

    expect(wrapper.findAll('.v-btn')).toHaveLength(2);
  });

  it('hides when all actions are removed', async () => {
    const initialActions = [createMockAction('save', 'Save')];

    const wrapper = mount(DfActions, {
      props: { actions: initialActions },
    });

    expect(wrapper.find('.v-btn').exists()).toBe(true);

    await wrapper.setProps({ actions: [] });

    // with no actions the component renders nothing
    expect(wrapper.find('.v-btn').exists()).toBe(false);
    expect(wrapper.find('div').exists()).toBe(false);
  });
  it('follows changes to a reactive actions ref', async () => {
    const actionsRef = <Ref<Action[]>>ref([createMockAction('save', 'Save')]);

    const wrapper = mount(DfActions, {
      props: { actions: actionsRef },
    });

    expect(wrapper.findAll('.v-btn')).toHaveLength(1);

    actionsRef.value.push(createMockAction('delete', 'Delete', 'trash-outline'));
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('.v-btn')).toHaveLength(2);
  });

  it('follows splice operations', async () => {
    const actionsRef = <Ref<Action[]>>(
      ref([
        createMockAction('save', 'Save'),
        createMockAction('delete', 'Delete'),
        createMockAction('cancel', 'Cancel'),
      ])
    );

    const wrapper = mount(DfActions, {
      props: { actions: actionsRef },
    });

    expect(wrapper.findAll('.v-btn')).toHaveLength(3);

    actionsRef.value.splice(1, 1);
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('.v-btn')).toHaveLength(2);
    expect(wrapper.findAll('.v-btn')[0].text()).toContain('Save');
    expect(wrapper.findAll('.v-btn')[1].text()).toContain('Cancel');
  });

  describe('defaultConfirm / defaultReject colour', () => {
    it('colours the button primary when defaultConfirm is set', () => {
      const action = createMockAction('save', 'Save');
      action.value.defaultConfirm = true;

      const wrapper = mount(DfActions, {
        props: { actions: [action] },
      });

      const buttonComponent = wrapper.findComponent({ name: 'v-btn' });
      expect(buttonComponent.props('color')).toBe('primary');
    });

    it('colours the button secondary when defaultReject is set', () => {
      const action = createMockAction('cancel', 'Cancel');
      action.value.defaultReject = true;

      const wrapper = mount(DfActions, {
        props: { actions: [action] },
      });

      const buttonComponent = wrapper.findComponent({ name: 'v-btn' });
      expect(buttonComponent.props('color')).toBe('secondary');
    });

    it('defaultConfirm takes precedence over defaultReject when both are set', () => {
      const action = createMockAction('close', 'Close');
      action.value.defaultConfirm = true;
      action.value.defaultReject = true;

      const wrapper = mount(DfActions, {
        props: { actions: [action] },
      });

      const buttonComponent = wrapper.findComponent({ name: 'v-btn' });
      expect(buttonComponent.props('color')).toBe('primary');
    });

    it('leaves the button without a colour when neither defaultConfirm nor defaultReject is set', () => {
      const action = createMockAction('neutral', 'Neutral');

      const wrapper = mount(DfActions, {
        props: { actions: [action] },
      });

      const buttonComponent = wrapper.findComponent({ name: 'v-btn' });
      expect(buttonComponent.props('color')).toBeUndefined();
    });
  });

  describe('enabled / disabled', () => {
    it('disables the button when action.enabled is false', () => {
      const action = createMockAction('save', 'Save');
      action.access = 'disabled';

      const wrapper = mount(DfActions, {
        props: { actions: [action] },
      });

      const buttonComponent = wrapper.findComponent({ name: 'v-btn' });
      expect(buttonComponent.props('disabled')).toBe(true);
    });

    it('enables the button when action.enabled is true (default)', () => {
      const action = createMockAction('save', 'Save');

      const wrapper = mount(DfActions, {
        props: { actions: [action] },
      });

      const buttonComponent = wrapper.findComponent({ name: 'v-btn' });
      expect(buttonComponent.props('disabled')).toBe(false);
    });

    it('disables the button when the group holding the action is disabled', () => {
      const action = createMockAction('save', 'Save');
      const form = new Group({ save: action });
      form.access = 'disabled';

      const wrapper = mount(DfActions, {
        props: { actions: [action] },
      });

      expect(action.enabled).toBe(true);
      const buttonComponent = wrapper.findComponent({ name: 'v-btn' });
      expect(buttonComponent.props('disabled')).toBe(true);
    });

    it('disables the button when a handler rejects it with canExecute()', async () => {
      const name = new Field({ value: '', validators: [new Validators.Required()] });
      const save = new Action({
        value: { name: 'save', label: 'Save', showLabel: true },
        actions: [new SubmitAction((): Group => form, vi.fn())],
      });
      const form: Group = new Group({ name, save });

      const wrapper = mount(DfActions, {
        props: { actions: [save] },
      });
      await flushPromises();

      const buttonComponent = wrapper.findComponent({ name: 'v-btn' });
      expect(save.effectiveEnabled).toBe(true);
      expect(buttonComponent.props('disabled')).toBe(true);

      name.value = 'Ana';
      await flushPromises();
      expect(buttonComponent.props('disabled')).toBe(false);
    });
  });

  describe('busy', () => {
    const pendingAction = (): [Action, () => void] => {
      let release: () => void = () => {};
      const pending = new Promise<void>((resolve) => {
        release = resolve;
      });
      const action = new Action({
        value: { name: 'save', label: 'Save', showLabel: true },
        actions: [new ExecuteAction(() => pending)],
      });
      return [action, release];
    };

    it('disables the button and shows it loading until the run settles', async () => {
      const [action, release] = pendingAction();

      const wrapper = mount(DfActions, {
        props: { actions: [action] },
      });

      const buttonComponent = wrapper.findComponent({ name: 'v-btn' });
      expect(buttonComponent.props('disabled')).toBe(false);
      expect(buttonComponent.props('loading')).toBe(false);

      const run = action.execute();
      await nextTick();
      expect(buttonComponent.props('disabled')).toBe(true);
      expect(buttonComponent.props('loading')).toBe(true);

      release();
      await run;
      await nextTick();
      expect(buttonComponent.props('disabled')).toBe(false);
      expect(buttonComponent.props('loading')).toBe(false);
    });

    it('a click on a running action starts no second run', async () => {
      const [action, release] = pendingAction();
      const executeSpy = vi.spyOn(action, 'execute');

      const wrapper = mount(DfActions, {
        props: { actions: [action] },
      });

      await wrapper.find('.v-btn').trigger('click');
      await nextTick();
      expect(wrapper.find('button').attributes('disabled')).toBeDefined();

      await wrapper.find('.v-btn').trigger('click');
      release();
      await executeSpy.mock.results[0].value;
      expect(executeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('bare vue-forms Action', () => {
    it('renders an action that carries only a label', () => {
      const action = new FormAction({ value: { label: 'Save' } });

      const wrapper = mount(DfActions, {
        props: { actions: [action] },
      });

      const buttonComponent = wrapper.findComponent({ name: 'v-btn' });
      expect(buttonComponent.text()).toContain('Save');
      expect(buttonComponent.props('variant')).toBe('tonal');
      expect(buttonComponent.props('disabled')).toBe(false);
    });

    it('executes an action that carries only a label on click', async () => {
      const executed = vi.fn();
      const action = new FormAction({ value: { label: 'Save' }, actions: [new ExecuteAction(executed)] });

      const wrapper = mount(DfActions, {
        props: { actions: [action] },
      });

      await wrapper.find('.v-btn').trigger('click');
      expect(executed).toHaveBeenCalledTimes(1);
    });
  });

  describe('visibility', () => {
    it('adds the d-none class when visibility is HIDDEN', () => {
      const action = createMockAction('save', 'Save');
      action.visibility = 'hidden';

      const wrapper = mount(DfActions, {
        props: { actions: [action] },
      });

      expect(wrapper.find('.v-btn').classes()).toContain('d-none');
    });

    it('adds the invisible class when visibility is invisible', () => {
      const action = createMockAction('save', 'Save');
      action.visibility = 'invisible';

      const wrapper = mount(DfActions, {
        props: { actions: [action] },
      });

      expect(wrapper.find('.v-btn').classes()).toContain('invisible');
    });

    it('renders no button when visibility is SUPPRESS', () => {
      const shownAction = createMockAction('save', 'Save');
      const suppressedAction = createMockAction('secret', 'Secret');
      suppressedAction.visibility = 'suppress';

      const wrapper = mount(DfActions, {
        props: { actions: [shownAction, suppressedAction] },
      });

      const buttons = wrapper.findAll('.v-btn');
      expect(buttons).toHaveLength(1);
      expect(buttons[0].text()).toContain('Save');
    });

    it('adds no classes when visibility is FULL (default)', () => {
      const action = createMockAction('save', 'Save');

      const wrapper = mount(DfActions, {
        props: { actions: [action] },
      });

      const button = wrapper.find('.v-btn');
      expect(button.classes()).not.toContain('d-none');
    });
  });

  describe('passthroughAttrs', () => {
    it('passes extra attributes to v-btn', () => {
      const action = createMockAction('save', 'Save');
      action.value.passthroughAttrs = { block: true, rounded: 'lg' };

      const wrapper = mount(DfActions, {
        props: { actions: [action] },
      });

      const buttonComponent = wrapper.findComponent({ name: 'v-btn' });
      expect(buttonComponent.props('block')).toBe(true);
      expect(buttonComponent.props('rounded')).toBe('lg');
    });

    it('passthroughAttrs.color overrides the colour derived from defaultConfirm', () => {
      const action = createMockAction('save', 'Save');
      action.value.defaultConfirm = true;
      action.value.passthroughAttrs = { color: 'error' };

      const wrapper = mount(DfActions, {
        props: { actions: [action] },
      });

      const buttonComponent = wrapper.findComponent({ name: 'v-btn' });
      expect(buttonComponent.props('color')).toBe('error');
    });
  });
  describe('accessible name', () => {
    const mountActions = (actions: Action[]) => mount(DfActions, { props: { actions } });

    it('names an icon-only button with aria-label and title', () => {
      const action = createMockAction('save', 'Save', 'save-outline');
      action.value.showLabel = false;

      const button = mountActions([action]).find('button');
      expect(button.text()).not.toContain('Save');
      expect(button.attributes('aria-label')).toBe('Save');
      expect(button.attributes('title')).toBe('Save');
    });

    it('sets neither aria-label nor title on a button that shows its label', () => {
      const button = mountActions([createMockAction('save', 'Save', 'save-outline')]).find('button');

      expect(button.text()).toContain('Save');
      expect(button.attributes('aria-label')).toBeUndefined();
      expect(button.attributes('title')).toBeUndefined();
    });

    it('names the button at a breakpoint that hides the label', () => {
      const action = new Action({
        value: {
          name: 'save',
          label: 'Save',
          icon: 'save-outline',
          showLabel: true,
          showIcon: true,
          xs: { showLabel: false },
        },
      });

      const button = mountActions([action]).find('button');
      expect(button.attributes('aria-label')).toBe('Save');
      expect(button.attributes('title')).toBe('Save');
    });

    it('lets passthroughAttrs override aria-label and title', () => {
      const action = createMockAction('save', 'Save', 'save-outline');
      action.value.showLabel = false;
      action.value.passthroughAttrs = { 'aria-label': 'Save the document', title: 'Ctrl+S' };

      const button = mountActions([action]).find('button');
      expect(button.attributes('aria-label')).toBe('Save the document');
      expect(button.attributes('title')).toBe('Ctrl+S');
    });

    it('takes the plain text of a rich label', () => {
      const action = new Action({
        value: {
          label: new HtmlString('<b>Save</b> &amp; close') as unknown as string,
          icon: 'save-outline',
          showLabel: false,
          showIcon: true,
        },
      });

      const button = mountActions([action]).find('button');
      expect(button.attributes('aria-label')).toBe('Save & close');
      expect(button.attributes('title')).toBe('Save & close');
    });

    it('reads a label given as a function', () => {
      const action = new Action({ value: { label: () => 'Save', icon: 'save-outline', showLabel: false } });

      expect(mountActions([action]).find('button').attributes('aria-label')).toBe('Save');
    });

    it('sets no aria-label where the action has no label', () => {
      const action = new Action({ value: { icon: 'save-outline', showIcon: true } });

      expect(mountActions([action]).find('button').attributes('aria-label')).toBeUndefined();
    });
  });

  describe('simple', () => {
    const mountSimple = (actions: Action[], props: Record<string, unknown> = {}) =>
      mount(DfActions, { props: { actions, simple: true, ...props } });

    it('renders native buttons instead of v-btn', () => {
      const wrapper = mountSimple([createMockAction('save', 'Save'), createMockAction('cancel', 'Cancel')]);

      expect(wrapper.findComponent(VBtn).exists()).toBe(false);
      expect(wrapper.find('.v-btn').exists()).toBe(false);
      const buttons = wrapper.findAll('button.df-action-simple');
      expect(buttons).toHaveLength(2);
      expect(buttons[0].attributes('type')).toBe('button');
      expect(buttons[0].attributes('role')).toBeUndefined();
      expect(wrapper.find('.df-actions').classes()).toContain('df-actions--simple');
    });

    it('shows the icon and the label', () => {
      const button = mountSimple([createMockAction('save', 'Save', 'mdi-content-save')]).find('button');

      expect(button.findComponent(CachedIcon).props('name')).toBe('mdi-content-save');
      expect(button.text()).toBe('Save');
      expect(button.attributes('aria-label')).toBeUndefined();
      expect(button.attributes('title')).toBeUndefined();
    });

    it('honours showIcon and showLabel', () => {
      const action = createMockAction('save', 'Save', 'mdi-content-save');
      action.value.showIcon = false;

      const button = mountSimple([action]).find('button');
      expect(button.findComponent(CachedIcon).exists()).toBe(false);
      expect(button.text()).toBe('Save');
    });

    it('names a button that does not show its label with aria-label and title', () => {
      const action = new Action({
        value: { label: 'Save', icon: 'mdi-content-save', showLabel: true, showIcon: true, xs: { showLabel: false } },
      });

      const button = mountSimple([action]).find('button');
      expect(button.text()).toBe('');
      expect(button.attributes('aria-label')).toBe('Save');
      expect(button.attributes('title')).toBe('Save');
    });

    it('lets passthroughAttrs override aria-label and title', () => {
      const action = createMockAction('save', 'Save', 'mdi-content-save');
      action.value.showLabel = false;
      action.value.passthroughAttrs = { 'aria-label': 'Save the document', title: 'Ctrl+S', 'data-test': 'save' };

      const button = mountSimple([action]).find('button');
      expect(button.attributes('aria-label')).toBe('Save the document');
      expect(button.attributes('title')).toBe('Ctrl+S');
      expect(button.attributes('data-test')).toBe('save');
    });

    it('is disabled where the action is not executable', () => {
      const action = createMockAction('save', 'Save');
      action.access = 'disabled';

      expect(mountSimple([action]).find('button').attributes('disabled')).toBeDefined();
    });

    it('executes the action on click', async () => {
      const action = createMockAction('save', 'Save');
      const executeSpy = vi.spyOn(action, 'execute');

      await mountSimple([action]).find('button').trigger('click');
      expect(executeSpy).toHaveBeenCalledTimes(1);
    });

    it('is disabled and aria-busy while a run is in flight', async () => {
      let release: () => void = () => {};
      const pending = new Promise<void>((resolve) => {
        release = resolve;
      });
      const action = new Action({ value: { label: 'Save' }, actions: [new ExecuteAction(() => pending)] });
      const wrapper = mountSimple([action]);
      const button = wrapper.find('button');
      expect(button.attributes('aria-busy')).toBeUndefined();

      const run = action.execute();
      await nextTick();
      expect(button.attributes('aria-busy')).toBe('true');
      expect(button.attributes('disabled')).toBeDefined();

      release();
      await run;
      await nextTick();
      expect(button.attributes('aria-busy')).toBeUndefined();
      expect(button.attributes('disabled')).toBeUndefined();
    });

    it('applies visibility', () => {
      const hidden = createMockAction('hidden', 'Hidden');
      hidden.visibility = 'hidden';
      const invisible = createMockAction('invisible', 'Invisible');
      invisible.visibility = 'invisible';
      const suppressed = createMockAction('suppressed', 'Suppressed');
      suppressed.visibility = 'suppress';

      const buttons = mountSimple([hidden, invisible, suppressed]).findAll('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0].classes()).toContain('d-none');
      expect(buttons[1].classes()).toContain('invisible');
    });

    it('keeps the grouping classes on the container', () => {
      const wrapper = mountSimple([createMockAction('save', 'Save')], { showAsGroup: 'grouped' });

      expect(wrapper.find('.df-actions').classes()).toEqual(
        expect.arrayContaining(['button-group', 'with-border', 'df-actions--simple']),
      );
    });

    it('renders a bare vue-forms Action', async () => {
      const execute = vi.fn();
      const action = new FormAction({ value: { label: 'Cancel' }, actions: [new ExecuteAction(execute)] });

      const button = mountSimple([action as Action]).find('button');
      expect(button.text()).toBe('Cancel');
      await button.trigger('click');
      expect(execute).toHaveBeenCalledTimes(1);
    });
  });
});
