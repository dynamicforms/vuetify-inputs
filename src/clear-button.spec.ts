import { Field } from '@dynamicforms/vue-forms';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { type Component, h } from 'vue';

import DfColor from '@/df-color.vue';
import DfDateTime from '@/df-datetime.vue';
import DfFile from '@/df-file.vue';
import DfImage from '@/df-image.vue';
import DfRtfEditor from '@/df-rtf-editor.vue';
import DfSelect from '@/df-select.vue';
import { vuetifyInputsSettingsKey, type VuetifyInputsSettings } from '@/helpers/settings';
import { makeComms } from '@/test-utils/files';

const comms = makeComms();

interface Case {
  name: string;
  component: Component;
  /** the element that takes focus once the field is cleared */
  control: string;
  props?: Record<string, unknown>;
  filled: unknown;
  /** the value of a cleared field */
  cleared: unknown;
}

const cases: Case[] = [
  {
    name: 'df-select',
    component: DfSelect,
    control: 'input[role="combobox"]',
    props: { choices: [{ id: 1, text: 'One' }] },
    filled: 1,
    cleared: null,
  },
  {
    name: 'df-select (multiple)',
    component: DfSelect,
    control: 'input[role="combobox"]',
    props: { choices: [{ id: 1, text: 'One' }], multiple: true },
    filled: [1],
    cleared: null,
  },
  {
    name: 'df-color',
    component: DfColor,
    control: 'input',
    props: { allowNull: true },
    filled: '#ff0000',
    cleared: null,
  },
  {
    name: 'df-datetime',
    component: DfDateTime,
    control: '.df-datetime-date input',
    props: { inputType: 'date' },
    filled: '2026-11-28',
    cleared: null,
  },
  { name: 'df-file', component: DfFile, control: 'input[type="file"]', props: { comms }, filled: 'f', cleared: null },
  { name: 'df-image', component: DfImage, control: 'input[type="file"]', props: { comms }, filled: 'f', cleared: null },
  { name: 'df-rtf-editor', component: DfRtfEditor, control: '[contenteditable]', filled: '<p>x</p>', cleared: '' },
];

const mounted: VueWrapper[] = [];
afterEach(() => mounted.splice(0).forEach((wrapper) => wrapper.unmount()));

async function mountCase(
  testCase: Case,
  control: Field,
  extra: Record<string, unknown> = {},
  options: { settings?: VuetifyInputsSettings; slots?: Record<string, any> } = {},
) {
  const wrapper = mount(testCase.component, {
    props: { control, label: 'Fruit', ...testCase.props, ...extra },
    slots: options.slots,
    global: { provide: { [vuetifyInputsSettingsKey]: options.settings ?? {} } },
    attachTo: document.body,
  });
  mounted.push(wrapper);
  await flushPromises();
  return wrapper;
}

// the clear button as the user reaches it: displayed, in the tab order
function clearButton(wrapper: VueWrapper): HTMLElement | null {
  const root = (wrapper.element as HTMLElement).parentElement!;
  const clearable = root.querySelector('.v-field__clearable') as HTMLElement | null;
  if (!clearable || clearable.style.display === 'none') return null;
  return clearable.querySelector('button');
}

async function press(element: HTMLElement, key: string, init: KeyboardEventInit = {}) {
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
  await flushPromises();
}

describe.each(cases)('$name clear button', (testCase) => {
  it('is a button in the tab order, named "Clear <label>"', async () => {
    const wrapper = await mountCase(testCase, new Field({ value: testCase.filled }));

    const button = clearButton(wrapper);
    expect(button).not.toBeNull();
    expect(button!.tagName).toBe('BUTTON');
    expect(button!.getAttribute('type')).toBe('button');
    expect(button!.tabIndex).toBe(0);
    expect(button!.getAttribute('aria-label')).toBe('Clear Fruit');
  });

  it.each(['Enter', ' '])('clears the value on %j and moves focus to the input', async (key) => {
    const control = new Field({ value: testCase.filled });
    const wrapper = await mountCase(testCase, control);
    const button = clearButton(wrapper)!;
    button.focus();

    await press(button, key);

    expect(control.value).toEqual(testCase.cleared);
    expect(document.activeElement).toBe(wrapper.element.parentElement!.querySelector(testCase.control));
    expect(clearButton(wrapper)).toBeNull();
  });

  it('clears once on a held Space', async () => {
    const control = new Field({ value: testCase.filled });
    const wrapper = await mountCase(testCase, control);
    const button = clearButton(wrapper)!;

    await press(button, ' ', { repeat: true });

    expect(control.value).toEqual(testCase.filled);
  });

  it('is not shown without a value', async () => {
    const wrapper = await mountCase(testCase, new Field({ value: testCase.cleared }));

    expect(clearButton(wrapper)).toBeNull();
  });

  it('is not shown while the field accepts no input', async () => {
    const wrapper = await mountCase(testCase, new Field({ value: testCase.filled, access: 'readonly' }));

    expect(clearButton(wrapper)).toBeNull();
  });

  it('is named through the translate setting', async () => {
    const translate = (key: string, params?: Record<string, unknown>) =>
      key === 'ClearField' ? `Počisti polje ${params?.label}` : key;
    const wrapper = await mountCase(testCase, new Field({ value: testCase.filled }), {}, { settings: { translate } });

    expect(clearButton(wrapper)!.getAttribute('aria-label')).toBe('Počisti polje Fruit');
  });
});

describe('df-select clear button', () => {
  const testCase = cases[0];

  it('is not shown without allowNull', async () => {
    const wrapper = await mountCase(testCase, new Field({ value: 1 }), { allowNull: false });

    expect(clearButton(wrapper)).toBeNull();
  });

  it('keeps the menu closed on Enter', async () => {
    const wrapper = await mountCase(testCase, new Field({ value: 1 }));

    await press(clearButton(wrapper)!, 'Enter');

    expect(wrapper.find('input[role="combobox"]').attributes('aria-expanded')).toBe('false');
  });

  it('is replaced by the clear slot, which takes the attributes of a clear button', async () => {
    const control = new Field({ value: 1 });
    const wrapper = await mountCase(
      testCase,
      control,
      {},
      {
        slots: {
          clear: ({ props }: { props: Record<string, any> }) => h('button', { class: 'app-clear', ...props }, 'x'),
        },
      },
    );
    const button = wrapper.find('.app-clear');
    expect(wrapper.find('.df-clear-button').exists()).toBe(false);
    expect(button.attributes('aria-label')).toBe('Clear Fruit');
    expect(button.attributes('tabindex')).toBeUndefined();

    await button.trigger('click');
    await flushPromises();

    expect(control.value).toBeNull();
  });

  it('renders no clear slot without allowNull', async () => {
    const wrapper = await mountCase(
      testCase,
      new Field({ value: 1 }),
      { allowNull: false },
      { slots: { clear: () => h('button', { class: 'app-clear' }, 'x') } },
    );

    expect(wrapper.find('.app-clear').exists()).toBe(false);
  });
});
