import { Field, Group, ValueChangedAction } from '@dynamicforms/vue-forms';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, toRaw } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import { VAutocomplete } from 'vuetify/components';

import DfSelect from '@/df-select.vue';
import { SelectChoice } from '@/helpers';

const ALL_CHOICES: SelectChoice[] = [1, 2, 3, 4].map((id) => ({ id, text: `Choice ${id}` }));
// A search returns at most this many choices, the way a paginated endpoint does: not every choice is loaded by one.
const PAGE_SIZE = 3;

/**
 * A fetchChoices whose every call stays pending until release() - the component's reaction to a value whose choices
 * are not there yet can then be checked before they arrive. Resolves ids through idValue, searches through query.
 */
function deferredFetchChoices(available: SelectChoice[] = ALL_CHOICES) {
  const pending: (() => void)[] = [];
  const fetchChoices = vi.fn(
    (query?: any, idValue?: any) =>
      new Promise<SelectChoice[]>((resolve) => {
        pending.push(() => {
          if (idValue != null) {
            const ids = Array.isArray(idValue) ? idValue : [idValue];
            resolve(available.filter((choice) => ids.includes(choice.id)));
          } else {
            resolve(available.filter((choice) => !query || choice.text.includes(query)).slice(0, PAGE_SIZE));
          }
        });
      }),
  );
  const release = async () => {
    await flushPromises();
    pending.splice(0).forEach((resolve) => resolve());
    await flushPromises();
  };
  return { fetchChoices, release };
}

describe('DfSelect', () => {
  let vuetify: any;

  beforeEach(() => {
    vuetify = createVuetify({ components });
  });

  const mountSelect = (props: Record<string, any>) =>
    mount(DfSelect, { props: { label: 'Select', ...props }, global: { plugins: [vuetify] } });

  const chipTexts = (wrapper: ReturnType<typeof mountSelect>) => wrapper.findAll('.v-chip').map((chip) => chip.text());

  describe('with fetchChoices', () => {
    it('keeps a multiple value while its choices are being fetched', async () => {
      const { fetchChoices, release } = deferredFetchChoices();
      const control = new Field<number[] | null>({ value: [2, 3] });
      const wrapper = mountSelect({ control, multiple: true, fetchChoices });

      await flushPromises();
      expect(control.value).toEqual([2, 3]);
      expect(fetchChoices).toHaveBeenCalledWith(undefined, [2, 3]);
      expect(wrapper.findComponent(VAutocomplete).props('loading')).toBe(true);

      await release();
      expect(wrapper.findComponent(VAutocomplete).props('loading')).toBe(false);
      expect(control.value).toEqual([2, 3]);
      expect(chipTexts(wrapper)).toEqual(['Choice 2', 'Choice 3']);
    });

    it('keeps a single value while its choice is being fetched', async () => {
      const { fetchChoices, release } = deferredFetchChoices();
      const control = new Field<number | null>({ value: 2 });
      const wrapper = mountSelect({ control, fetchChoices });

      await flushPromises();
      expect(control.value).toBe(2);
      expect(fetchChoices).toHaveBeenCalledWith(undefined, 2);

      await release();
      expect(control.value).toBe(2);
      expect(chipTexts(wrapper)).toEqual(['Choice 2']);
    });

    it('shows an id fetchChoices has answered no choice for as the id, and keeps it', async () => {
      const { fetchChoices, release } = deferredFetchChoices();
      const control = new Field<number[] | null>({ value: [2, 99] });
      const wrapper = mountSelect({ control, multiple: true, fetchChoices });

      await flushPromises();
      expect(control.value).toEqual([2, 99]);
      expect(chipTexts(wrapper)).toEqual([]);

      await release();
      expect(control.value).toEqual([2, 99]);
      expect(control.isChanged).toBe(false);
      expect(chipTexts(wrapper)).toEqual(['Choice 2', '99']);
    });

    it('resolves the ids of a value set after mount that no loaded choice covers', async () => {
      const { fetchChoices, release } = deferredFetchChoices();
      const control = new Field<number[] | null>({ value: null });
      const wrapper = mountSelect({ control, multiple: true, fetchChoices });
      await release();
      fetchChoices.mockClear();

      control.value = [1, 4];
      await flushPromises();
      expect(control.value).toEqual([1, 4]);
      expect(fetchChoices).toHaveBeenCalledWith(undefined, [4]);

      await release();
      expect(control.value).toEqual([1, 4]);
      expect(chipTexts(wrapper)).toEqual(['Choice 1', 'Choice 4']);
    });

    it('fetches nothing for a value set after mount whose choices are already loaded', async () => {
      const { fetchChoices, release } = deferredFetchChoices();
      const control = new Field<number[] | null>({ value: null });
      const wrapper = mountSelect({ control, multiple: true, fetchChoices });
      await release();
      fetchChoices.mockClear();

      control.value = [1];
      await flushPromises();

      expect(fetchChoices).not.toHaveBeenCalled();
      expect(control.value).toEqual([1]);
      expect(chipTexts(wrapper)).toEqual(['Choice 1']);
    });

    it('loads the unfiltered choices for an empty value and selects nothing when null is not allowed', async () => {
      const { fetchChoices, release } = deferredFetchChoices();
      const control = new Field<number | null>({ value: null });
      mountSelect({ control, fetchChoices, allowNull: false });

      await release();
      expect(fetchChoices).toHaveBeenCalledWith(undefined, null);
      expect(control.value).toBeNull();
      expect(control.isChanged).toBe(false);
    });
  });

  describe('with fetchChoices, read-only', () => {
    it('shows the choices of its value without changing it', async () => {
      const { fetchChoices, release } = deferredFetchChoices();
      const control = new Field<number[] | null>({ value: [2, 4] });
      const wrapper = mountSelect({ control, multiple: true, fetchChoices, readonly: true });

      await release();
      expect(control.value).toEqual([2, 4]);
      expect(chipTexts(wrapper)).toEqual(['Choice 2', 'Choice 4']);
    });
  });

  describe('with static choices', () => {
    it('shows ids that are not among the choices as the id, and keeps them', async () => {
      const control = new Field<number[] | null>({ value: [2, 99] });
      const wrapper = mountSelect({ control, multiple: true, choices: ALL_CHOICES });

      await flushPromises();
      expect(control.value).toEqual([2, 99]);
      expect(chipTexts(wrapper)).toEqual(['Choice 2', '99']);
    });

    it('shows the choice for an id once the choices are given', async () => {
      const control = new Field<number | null>({ value: 3 });
      const wrapper = mountSelect({ control, choices: [] });
      await flushPromises();
      expect(chipTexts(wrapper)).toEqual(['3']);

      await wrapper.setProps({ choices: ALL_CHOICES });
      await flushPromises();
      expect(chipTexts(wrapper)).toEqual(['Choice 3']);
      expect(control.value).toBe(3);
    });
  });

  describe('setting up and mounting', () => {
    it.each([
      { name: 'an empty array', value: [], multiple: true, allowNull: true },
      { name: 'null', value: null, multiple: true, allowNull: true },
      { name: 'an empty array without allowNull', value: [], multiple: true, allowNull: false },
      { name: 'null without allowNull', value: null, multiple: false, allowNull: false },
      { name: 'a multiple value', value: [1, 2], multiple: true, allowNull: true },
      { name: 'a single value', value: 2, multiple: false, allowNull: true },
      { name: 'an id that is not among the choices', value: 99, multiple: false, allowNull: true },
    ])('leave $name as it is', async ({ value, multiple, allowNull }) => {
      const control = new Field<any>({ value });
      const changed = vi.fn();
      control.registerAction(
        new ValueChangedAction((field, supr, newValue, oldValue) => {
          changed(newValue);
          return supr(field, newValue, oldValue);
        }),
      );
      const wrapper = mountSelect({ control, multiple, allowNull, choices: ALL_CHOICES });
      await flushPromises();

      expect(toRaw(control.value)).toBe(value);
      expect(changed).not.toHaveBeenCalled();
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });
  });

  describe('emptying a multiple select', () => {
    it.each([{ initial: [1] }, { initial: [] as number[] }])(
      'closing the last chip leaves an empty array (initial $initial)',
      async ({ initial }) => {
        const control = new Field<number[] | null>({ value: initial });
        const wrapper = mountSelect({ control, multiple: true, choices: ALL_CHOICES });
        await flushPromises();
        if (!initial.length) {
          wrapper.findComponent(VAutocomplete).vm.$emit('update:modelValue', [1]);
          await flushPromises();
          expect(control.value).toEqual([1]);
        }

        await wrapper.find('.v-chip .v-chip__close').trigger('click');
        await flushPromises();
        expect(control.value).toEqual([]);
      },
    );

    it('the clear button sets null', async () => {
      const control = new Field<number[] | null>({ value: [1, 2] });
      const values: any[] = [];
      control.registerAction(
        new ValueChangedAction((field, supr, newValue, oldValue) => {
          values.push(newValue);
          return supr(field, newValue, oldValue);
        }),
      );
      const wrapper = mountSelect({ control, multiple: true, choices: ALL_CHOICES });
      await flushPromises();

      await wrapper.find('.v-field__clearable .v-icon').trigger('click');
      await flushPromises();
      expect(control.value).toBeNull();
      expect(values).toEqual([null]);
    });
  });

  describe('with allowTags', () => {
    it('keeps a value set after mount that no choice covers', async () => {
      const control = new Field<string | null>({ value: null });
      const wrapper = mountSelect({ control, allowTags: true, choices: [] });
      await flushPromises();

      control.value = 'new';
      await flushPromises();
      expect(control.value).toBe('new');
      expect(wrapper.findComponent(components.VCombobox).props('modelValue')).toBe('new');
    });

    it('keeps a multiple value set after mount that no choice covers', async () => {
      const control = new Field<string[] | null>({ value: null });
      mountSelect({ control, allowTags: true, multiple: true, choices: [] });
      await flushPromises();

      control.value = ['a', 'b'];
      await flushPromises();
      expect(control.value).toEqual(['a', 'b']);
    });
  });

  describe('with allowNull false and multiple', () => {
    const closeButtons = (wrapper: ReturnType<typeof mountSelect>) =>
      wrapper.findAll('.v-chip').map((chip) => chip.find('.v-chip__close').exists());

    it('offers no close on the only chip and keeps its value', async () => {
      const control = new Field<number[] | null>({ value: [1] });
      const wrapper = mountSelect({ control, multiple: true, allowNull: false, choices: ALL_CHOICES });
      await flushPromises();

      expect(closeButtons(wrapper)).toEqual([false]);
    });

    it('offers close on every chip while more than one is selected', async () => {
      const control = new Field<number[] | null>({ value: [1, 2] });
      const wrapper = mountSelect({ control, multiple: true, allowNull: false, choices: ALL_CHOICES });
      await flushPromises();

      expect(closeButtons(wrapper)).toEqual([true, true]);
      await wrapper.find('.v-chip .v-chip__close').trigger('click');
      await flushPromises();
      expect(control.value).toEqual([2]);
      expect(closeButtons(wrapper)).toEqual([false]);
    });

    it('keeps the last tag of a taggable select', async () => {
      const control = new Field<string[] | null>({ value: ['a'] });
      const wrapper = mountSelect({ control, multiple: true, allowNull: false, allowTags: true, choices: [] });
      await flushPromises();

      expect(closeButtons(wrapper)).toEqual([false]);
      expect(control.value).toEqual(['a']);
    });
  });

  describe('with a disabled control', () => {
    it('selects no default while disabled nor once enabled', async () => {
      const control = new Field<number | null>({ value: null, access: 'disabled' });
      mountSelect({ control, choices: ALL_CHOICES, allowNull: false });

      await flushPromises();
      expect(control.value).toBeNull();
      expect(control.isChanged).toBe(false);

      control.access = 'editable';
      await flushPromises();
      expect(control.value).toBeNull();
      expect(control.isChanged).toBe(false);
    });

    it('keeps ids that are not among the choices', async () => {
      const control = new Field<number[] | null>({ value: [2, 99], access: 'disabled' });
      mountSelect({ control, multiple: true, choices: ALL_CHOICES });

      await flushPromises();
      expect(control.value).toEqual([2, 99]);
    });

    it('selects no default inside a disabled container', async () => {
      const control = new Field<number | null>({ value: null });
      const form = new Group({ choice: control }, { access: 'disabled' });
      mountSelect({ control, choices: ALL_CHOICES, allowNull: false });

      await flushPromises();
      expect(control.value).toBeNull();
      expect(form.isChanged).toBe(false);
    });
  });

  describe('with v-model', () => {
    /**
     * Mounts the select under a parent that binds it with v-model. The parent stops taking values after
     * MAX_UPDATES, so a select and a parent that keep swapping values end the test instead of hanging it.
     */
    const MAX_UPDATES = 10;
    const mountWithVModel = (initial: any, props: Record<string, any>) => {
      const model = ref<any>(initial);
      const updates: any[] = [];
      const Parent = defineComponent({
        setup: () => () =>
          h(DfSelect, {
            label: 'Select',
            ...props,
            modelValue: model.value,
            'onUpdate:modelValue': (value: any) => {
              updates.push(value);
              if (updates.length <= MAX_UPDATES) model.value = value;
            },
          }),
      });
      const wrapper = mount(Parent, { global: { plugins: [vuetify] } });
      return { wrapper, model, updates };
    };

    it.each([
      { multiple: true, initial: [1], picked: [1, 2] },
      { multiple: false, initial: 1, picked: 2 },
    ])('keeps a selection the parent passes back (multiple: $multiple)', async ({ multiple, initial, picked }) => {
      const { wrapper, model, updates } = mountWithVModel(initial, { multiple, choices: ALL_CHOICES });
      await flushPromises();
      updates.length = 0;

      wrapper.findComponent(VAutocomplete).vm.$emit('update:modelValue', picked);
      await flushPromises();

      expect(model.value).toEqual(picked);
      expect(updates.every((value) => JSON.stringify(value) === JSON.stringify(picked))).toBe(true);
    });
  });

  describe('with a control that does not take a write verbatim', () => {
    it('shows the value the control holds', async () => {
      const control = new Field<number[] | null>({ value: [1] });
      control.registerAction(
        new ValueChangedAction<number[] | null>((field, supr, newValue, oldValue) => {
          const withoutFour = (newValue ?? []).filter((id) => id !== 4);
          if (withoutFour.length !== (newValue ?? []).length) field.value = withoutFour;
          return supr(field, newValue, oldValue);
        }),
      );
      const wrapper = mountSelect({ control, multiple: true, choices: ALL_CHOICES });
      await flushPromises();

      wrapper.findComponent(VAutocomplete).vm.$emit('update:modelValue', [1, 4]);
      await flushPromises();

      expect(control.value).toEqual([1]);
      expect(wrapper.findComponent(VAutocomplete).props('modelValue')).toEqual([1]);
    });
  });

  describe('accessibility', () => {
    const ICON_CHOICES: SelectChoice[] = [1, 2, 3].map((id) => ({ id, text: `Choice ${id}`, icon: 'mdi-account' }));

    it('labels each chip close button with the chip text', async () => {
      const wrapper = mountSelect({ control: new Field({ value: [1, 2] }), multiple: true, choices: ALL_CHOICES });
      await flushPromises();

      const labels = wrapper.findAll('.v-chip__close').map((button) => button.attributes('aria-label'));
      expect(labels).toEqual(['Remove Choice 1', 'Remove Choice 2']);
    });

    it.each(['Enter', ' '])('removes a chip with %j on its close button and focuses the next one', async (key) => {
      const control = new Field<number[] | null>({ value: [1, 2, 3] });
      const wrapper = mount(DfSelect, {
        props: { label: 'Select', control, multiple: true, choices: ALL_CHOICES },
        global: { plugins: [vuetify] },
        attachTo: document.body,
      });
      await flushPromises();

      const button = wrapper.findAll('.v-chip__close')[1];
      (button.element as HTMLElement).focus();
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      button.element.dispatchEvent(event);
      await flushPromises();

      expect(event.defaultPrevented).toBe(true);
      expect(control.value).toEqual([1, 3]);
      expect(wrapper.findComponent(VAutocomplete).props('menu')).toBe(false);
      expect(document.activeElement?.getAttribute('aria-label')).toBe('Remove Choice 3');
      wrapper.unmount();
    });

    it('removes no chip on a repeated Space keydown and keeps it from the autocomplete', async () => {
      const control = new Field<number[] | null>({ value: [1, 2, 3] });
      const wrapper = mountSelect({ control, multiple: true, choices: ALL_CHOICES });
      await flushPromises();
      const onParentKeydown = vi.fn();
      wrapper.find('.v-chip').element.addEventListener('keydown', onParentKeydown);

      const event = new KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true, cancelable: true });
      wrapper.find('.v-chip__close').element.dispatchEvent(event);
      await flushPromises();

      expect(event.defaultPrevented).toBe(true);
      expect(onParentKeydown).not.toHaveBeenCalled();
      expect(control.value).toEqual([1, 2, 3]);
    });

    it('labels a close button with a choice text holding a placeholder as it is', async () => {
      const choices: SelectChoice[] = [
        { id: 1, text: 'Size {0}' },
        { id: 2, text: 'Size {choice}' },
      ];
      const wrapper = mountSelect({ control: new Field({ value: [1, 2] }), multiple: true, choices });
      await flushPromises();

      const labels = wrapper.findAll('.v-chip__close').map((button) => button.attributes('aria-label'));
      expect(labels).toEqual(['Remove Size {0}', 'Remove Size {choice}']);
    });

    it('removes a chip on a click on its close button', async () => {
      const control = new Field<number[] | null>({ value: [1, 2] });
      const wrapper = mountSelect({ control, multiple: true, choices: ALL_CHOICES });
      await flushPromises();

      await wrapper.find('.v-chip__close').trigger('click');
      await flushPromises();

      expect(control.value).toEqual([2]);
      expect(wrapper.findAll('.v-chip')).toHaveLength(1);
    });

    it('focuses the input once no closable chip remains', async () => {
      const control = new Field<number[] | null>({ value: [1, 2] });
      const wrapper = mount(DfSelect, {
        props: { label: 'Select', control, multiple: true, allowNull: false, choices: ALL_CHOICES },
        global: { plugins: [vuetify] },
        attachTo: document.body,
      });
      await flushPromises();

      wrapper
        .find('.v-chip__close')
        .element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await flushPromises();

      expect(control.value).toEqual([2]);
      expect(document.activeElement).toBe(wrapper.find('input').element);
      wrapper.unmount();
    });

    it('leaves other keys on a chip to the autocomplete', async () => {
      const control = new Field<number[] | null>({ value: [1, 2] });
      const wrapper = mountSelect({ control, multiple: true, choices: ALL_CHOICES });
      await flushPromises();

      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
      wrapper.find('.v-chip__close').element.dispatchEvent(event);
      await flushPromises();

      expect(event.defaultPrevented).toBe(false);
      expect(control.value).toEqual([1, 2]);
    });

    it('hides choice icons in chips and options from assistive technology', async () => {
      const wrapper = mount(DfSelect, {
        props: { label: 'Select', control: new Field({ value: [1] }), multiple: true, choices: ICON_CHOICES },
        global: { plugins: [vuetify] },
        attachTo: document.body,
      });
      await flushPromises();

      const chipIcons = wrapper.findAll('.v-chip .cached-icon-wrapper');
      expect(chipIcons).toHaveLength(1);
      expect(chipIcons[0].attributes('aria-hidden')).toBe('true');

      await wrapper.find('.v-field').trigger('mousedown');
      await flushPromises();
      const optionIcons = document.querySelectorAll('.v-overlay-container .v-list-item .cached-icon-wrapper');
      expect(optionIcons).toHaveLength(ICON_CHOICES.length);
      optionIcons.forEach((icon) => expect(icon.getAttribute('aria-hidden')).toBe('true'));
      wrapper.unmount();
    });

    it.each(['', '  '])('gives a blank id outside the choices no choice and keeps it (%j)', async (blank) => {
      const control = new Field<any>({ value: blank });
      const onDisplay = vi.fn();
      const wrapper = mount(DfSelect, {
        props: { label: 'Select', control, choices: ALL_CHOICES, 'onUpdate:modelValueDisplay': onDisplay },
        global: { plugins: [vuetify] },
      });
      await flushPromises();

      const items = wrapper.findComponent(VAutocomplete).props('items') as { title: string }[];
      expect(items.map((item) => item.title)).toEqual(ALL_CHOICES.map((choice) => choice.text));
      expect(wrapper.findAll('.v-chip')).toHaveLength(0);
      expect(onDisplay).toHaveBeenLastCalledWith([]);
      expect(control.value).toBe(blank);
    });

    it('keeps a blank id of a multiple value through chip removal and selection', async () => {
      const control = new Field<any>({ value: [1, ''] });
      const wrapper = mountSelect({ control, multiple: true, choices: ALL_CHOICES });
      await flushPromises();
      expect(wrapper.findAll('.v-chip').map((chip) => chip.text())).toEqual(['Choice 1']);

      await wrapper.find('.v-chip__close').trigger('click');
      await flushPromises();
      expect(control.value).toEqual(['']);

      wrapper.findComponent(VAutocomplete).vm.$emit('update:modelValue', [2]);
      await flushPromises();
      expect(control.value).toEqual([2, '']);
    });

    it('names the progress bar shown while choices are fetched', async () => {
      const { fetchChoices, release } = deferredFetchChoices();
      const wrapper = mountSelect({ control: new Field({ value: 2 }), fetchChoices });
      await flushPromises();

      const bar = wrapper.find('.v-field__loader [role="progressbar"]');
      expect(bar.attributes('aria-label')).toBe('Loading');
      expect(bar.attributes('aria-hidden')).toBe('false');
      await release();
    });
  });

  it('renders the autocomplete once mounted where Vuetify is created for server-side rendering', async () => {
    const ssrVuetify = createVuetify({ ssr: true, components });
    const choices = [{ id: 1, text: 'One' }];
    const wrapper = mount(DfSelect, { props: { choices, modelValue: 1 }, global: { plugins: [ssrVuetify] } });

    await flushPromises();

    expect(wrapper.findComponent(VAutocomplete).exists()).toBe(true);
  });
});
