import { Field, ValueChangedAction } from '@dynamicforms/vue-forms';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
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

    it('drops an id only once fetchChoices has answered without a choice for it', async () => {
      const { fetchChoices, release } = deferredFetchChoices();
      const control = new Field<number[] | null>({ value: [2, 99] });
      const wrapper = mountSelect({ control, multiple: true, fetchChoices });

      await flushPromises();
      expect(control.value).toEqual([2, 99]);

      await release();
      expect(control.value).toEqual([2]);
      expect(chipTexts(wrapper)).toEqual(['Choice 2']);
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

    it('loads the unfiltered choices for an empty value and selects the first when null is not allowed', async () => {
      const { fetchChoices, release } = deferredFetchChoices();
      const control = new Field<number | null>({ value: null });
      mountSelect({ control, fetchChoices, allowNull: false });

      await release();
      expect(fetchChoices).toHaveBeenCalledWith(undefined, null);
      expect(control.value).toBe(1);
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
    it('drops ids that are not among the choices', async () => {
      const control = new Field<number[] | null>({ value: [2, 99] });
      mountSelect({ control, multiple: true, choices: ALL_CHOICES });

      await flushPromises();
      expect(control.value).toEqual([2]);
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
});
