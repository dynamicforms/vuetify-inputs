// df-actions.spec.ts
import { ExecuteAction } from '@dynamicforms/vue-forms';
import { mount } from '@vue/test-utils';
import { Ref, ref } from 'vue';
import { createVuetify } from 'vuetify';
import { VBtn } from 'vuetify/components';

import DfActions from '@/df-actions.vue';
import { Action, ActionDisplayStyle } from '@/helpers';

// Mock vue-ionicon
vi.mock('vue-ionicon', () => ({
  default: {
    name: 'IonIcon',
    props: ['name'],
    template: '<span class="ion-icon" :data-icon="name"></span>',
  },
}));

describe('DfActions', () => {
  let vuetify: any;

  beforeEach(() => {
    vuetify = createVuetify({ components: { VBtn } }); // eksplicitno registriraj komponente
  });

  const createMockAction = (name: string, label: string, icon?: string): Action => {
    const executeAction = new ExecuteAction(vi.fn());
    return Action.create({
      value: {
        name,
        label,
        icon,
        renderAs: ActionDisplayStyle.BUTTON,
        showLabel: true,
        showIcon: !!icon,
      },
      actions: [executeAction],
    });
  };

  it('renderira pravilno število gumbov', () => {
    const actions = [
      createMockAction('save', 'Save', 'save-outline'),
      createMockAction('cancel', 'Cancel', 'close-outline'),
    ];

    const wrapper = mount(DfActions, {
      props: { actions },
      global: { plugins: [vuetify] },
    });

    expect(wrapper.findAll('.v-btn')).toHaveLength(2);
  });

  it('prikaže pravilno besedilo in ikone', () => {
    const actions = [createMockAction('save', 'Save', 'save-outline')];

    const wrapper = mount(DfActions, {
      props: { actions },
      global: { plugins: [vuetify] },
    });

    const button = wrapper.find('.v-btn');
    expect(button.text()).toContain('Save');
    expect(button.find('[data-icon="save-outline"]')).toBeTruthy();
  });

  it('pokliče execute ob kliku', async () => {
    const mockExecute = vi.fn();
    const action = createMockAction('save', 'Save');
    action.execute = mockExecute;

    const wrapper = mount(DfActions, {
      props: { actions: [action] },
      global: { plugins: [vuetify] },
    });

    await wrapper.find('.v-btn').trigger('click');
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('ne prikaže ničesar če ni akcij', () => {
    const wrapper = mount(DfActions, {
      props: { actions: [] },
      global: { plugins: [vuetify] },
    });

    expect(wrapper.find('.v-btn').exists()).toBe(false);
  });

  it('uporablja button-group razred ko je showAsGroup nastavljen', () => {
    const actions = [createMockAction('save', 'Save')];

    const wrapper = mount(DfActions, {
      props: { actions, showAsGroup: 'grouped' },
      global: { plugins: [vuetify] },
    });

    expect(wrapper.find('.button-group').exists()).toBe(true);
    expect(wrapper.find('.with-border').exists()).toBe(true);
  });

  it('nastavi pravilno velikost gumbov', () => {
    const actions = [createMockAction('save', 'Save')];

    const wrapper = mount(DfActions, {
      props: { actions, buttonSize: 'large' },
      global: { plugins: [vuetify] },
    });

    const buttonComponent = wrapper.findComponent({ name: 'v-btn' });
    expect(buttonComponent.props('size')).toBe('large');
  });
  it('renderira gumb kot text variant', () => {
    const action = createMockAction('save', 'Save');
    // Nastavi renderAs na TEXT
    action.value.renderAs = ActionDisplayStyle.TEXT;

    const wrapper = mount(DfActions, {
      props: { actions: [action] },
      global: {
        plugins: [vuetify],
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

  it('prikaže spacer med ikono in besedilom', () => {
    const action = createMockAction('save', 'Save', 'save-outline');

    const wrapper = mount(DfActions, {
      props: { actions: [action] },
      global: { plugins: [vuetify] },
    });

    // Išči span z width: .5rem
    const spacer = wrapper.find('span[style*="width: .5rem"]');
    expect(spacer.exists()).toBe(true);
  });

  it('ne prikaže spacer-ja če ni ikone ali besedila', () => {
    const actionOnlyIcon = createMockAction('save', '', 'save-outline');

    const wrapper = mount(DfActions, {
      props: { actions: [actionOnlyIcon] },
      global: { plugins: [vuetify] },
    });

    const spacer = wrapper.find('span[style*="width: .5rem"]');
    expect(spacer.exists()).toBe(false);
  });

  it('nastavi pravilne CSS klase za grupiranje', () => {
    const actions = [createMockAction('save', 'Save')];

    const wrapper = mount(DfActions, {
      props: { actions, showAsGroup: 'grouped-no-borders' },
      global: { plugins: [vuetify] },
    });

    const container = wrapper.find('div');
    expect(container.classes()).toContain('button-group');
    expect(container.classes()).not.toContain('with-border');
  });
  it('reagira na spremembe v actions prop-u (reaktivnost)', async () => {
    const initialActions = [createMockAction('save', 'Save')];

    const wrapper = mount(DfActions, {
      props: { actions: initialActions },
      global: { plugins: [vuetify] },
    });

    // Začetno stanje - 1 gumb
    expect(wrapper.findAll('.v-btn')).toHaveLength(1);

    // Dodaj novo akcijo v array
    const newActions = [
      ...initialActions,
      createMockAction('delete', 'Delete', 'trash-outline'),
    ];

    // Posodobi prop
    await wrapper.setProps({ actions: newActions });

    // Preveri, da se je renderiral nov gumb
    expect(wrapper.findAll('.v-btn')).toHaveLength(2);

    // Preveri, da so besedila pravilna
    const buttons = wrapper.findAll('.v-btn');
    expect(buttons[0].text()).toContain('Save');
    expect(buttons[1].text()).toContain('Delete');
  });

  it('reagira na odstranitev akcij', async () => {
    const initialActions = [
      createMockAction('save', 'Save'),
      createMockAction('delete', 'Delete'),
      createMockAction('cancel', 'Cancel'),
    ];

    const wrapper = mount(DfActions, {
      props: { actions: initialActions },
      global: { plugins: [vuetify] },
    });

    expect(wrapper.findAll('.v-btn')).toHaveLength(3);

    // Odstrani eno akcijo
    await wrapper.setProps({ actions: initialActions.slice(0, 2) });

    expect(wrapper.findAll('.v-btn')).toHaveLength(2);
  });

  it('se skrije, ko se vsi actions odstranijo', async () => {
    const initialActions = [createMockAction('save', 'Save')];

    const wrapper = mount(DfActions, {
      props: { actions: initialActions },
      global: { plugins: [vuetify] },
    });

    expect(wrapper.find('.v-btn').exists()).toBe(true);

    // Odstrani vse actions
    await wrapper.setProps({ actions: [] });

    // Komponenta se mora skriti (v-if="actionsRef.length > 0")
    expect(wrapper.find('.v-btn').exists()).toBe(false);
    expect(wrapper.find('div').exists()).toBe(false);
  });
  it('reagira na spremembe v reaktivnem actions ref-u', async () => {
    const actionsRef = <Ref<Action[]>> ref([createMockAction('save', 'Save')]);

    const wrapper = mount(DfActions, {
      props: { actions: actionsRef },
      global: { plugins: [vuetify] },
    });

    // Začetno stanje - 1 gumb
    expect(wrapper.findAll('.v-btn')).toHaveLength(1);

    // Dodaj akcijo v reaktivni ref
    actionsRef.value.push(createMockAction('delete', 'Delete', 'trash-outline'));
    await wrapper.vm.$nextTick();

    // Bi se moral avtomatsko posodobiti render
    expect(wrapper.findAll('.v-btn')).toHaveLength(2);
  });

  it('reagira na splice operacije', async () => {
    const actionsRef = <Ref<Action[]>> ref([
      createMockAction('save', 'Save'),
      createMockAction('delete', 'Delete'),
      createMockAction('cancel', 'Cancel'),
    ]);

    const wrapper = mount(DfActions, {
      props: { actions: actionsRef },
      global: { plugins: [vuetify] },
    });

    expect(wrapper.findAll('.v-btn')).toHaveLength(3);

    // Odstrani srednjo akcijo
    actionsRef.value.splice(1, 1);
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('.v-btn')).toHaveLength(2);
    expect(wrapper.findAll('.v-btn')[0].text()).toContain('Save');
    expect(wrapper.findAll('.v-btn')[1].text()).toContain('Cancel');
  });
});
