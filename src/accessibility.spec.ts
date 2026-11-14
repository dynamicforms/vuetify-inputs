import { Field, Validators } from '@dynamicforms/vue-forms';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Component } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';

import DfCheckbox from '@/df-checkbox.vue';
import DfColor from '@/df-color.vue';
import DfDateTime from '@/df-datetime.vue';
import DfFile from '@/df-file.vue';
import DfImage from '@/df-image.vue';
import DfInput from '@/df-input.vue';
import DfRtfEditor from '@/df-rtf-editor.vue';
import DfSelect from '@/df-select.vue';
import DfTextArea from '@/df-text-area.vue';

const comms = { upload: async () => 'id', delete: async () => {}, touch: async () => {} };

interface Case {
  name: string;
  component: Component;
  /** the elements the user operates */
  controls: string;
  props?: Record<string, unknown>;
  empty: unknown;
  /** a value the Required validator accepts */
  filled: unknown;
}

const cases: Case[] = [
  { name: 'df-input', component: DfInput, controls: 'input', empty: '', filled: 'x' },
  {
    name: 'df-input (number)',
    component: DfInput,
    controls: 'input',
    props: { inputType: 'number' },
    empty: null,
    filled: 1,
  },
  { name: 'df-text-area', component: DfTextArea, controls: 'textarea', empty: '', filled: 'x' },
  { name: 'df-checkbox', component: DfCheckbox, controls: 'input[type="checkbox"]', empty: null, filled: true },
  {
    name: 'df-select',
    component: DfSelect,
    controls: 'input[role="combobox"]',
    props: { choices: [{ id: 1, text: 'One' }] },
    empty: null,
    filled: 1,
  },
  { name: 'df-color', component: DfColor, controls: 'input', empty: '', filled: '#ff0000' },
  {
    name: 'df-datetime',
    component: DfDateTime,
    controls: '.df-datetime-date input, .df-datetime-time input',
    empty: null,
    filled: '2026-11-13T09:30:00.000Z',
  },
  { name: 'df-file', component: DfFile, controls: 'input[type="file"]', props: { comms }, empty: null, filled: 'f' },
  { name: 'df-image', component: DfImage, controls: 'input[type="file"]', props: { comms }, empty: null, filled: 'f' },
  { name: 'df-rtf-editor', component: DfRtfEditor, controls: '[contenteditable]', empty: '', filled: '<p>x</p>' },
];

const inputBaseHosted: Component[] = [DfDateTime, DfFile, DfImage, DfRtfEditor];

const mounted: VueWrapper[] = [];
afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount());
});

async function mountCase(testCase: Case, control: Field, extra: Record<string, unknown> = {}) {
  const wrapper = mount(testCase.component, {
    props: { control, label: 'Field label', hint: 'Hint text', ...testCase.props, ...extra },
    global: { plugins: [createVuetify({ components })] },
    attachTo: document.body,
  });
  mounted.push(wrapper);
  await flushPromises();
  return wrapper;
}

function controlsOf(wrapper: VueWrapper, selector: string): HTMLElement[] {
  const root = wrapper.element.parentElement as HTMLElement;
  const found = [...root.querySelectorAll<HTMLElement>(selector)];
  expect(found.length).toBeGreaterThan(0);
  return found;
}

function byIds(ids: string | null): HTMLElement[] {
  return (ids ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => {
      const element = document.getElementById(id);
      expect(element, `#${id}`).not.toBeNull();
      return element!;
    });
}

// the text the accessible name is taken from: aria-labelledby, otherwise the labels whose `for` names the element
function nameText(element: HTMLElement): string {
  const labelledBy = element.getAttribute('aria-labelledby');
  const sources = labelledBy ? byIds(labelledBy) : [...document.querySelectorAll(`label[for="${element.id}"]`)];
  return sources.map((source) => source.textContent?.trim()).join(' ');
}

function descriptionText(element: HTMLElement): string {
  return byIds(element.getAttribute('aria-describedby'))
    .map((source) => source.textContent)
    .join(' ');
}

function requiredField(empty: unknown) {
  return new Field({ value: empty, validators: [new Validators.Required()] });
}

describe.each(cases)('$name', (testCase) => {
  it('is named by the field label', async () => {
    const wrapper = await mountCase(testCase, new Field({ value: testCase.empty }));

    controlsOf(wrapper, testCase.controls).forEach((control) => {
      expect(nameText(control)).toContain('Field label');
      // the controls InputBase hosts also carry the label as text
      if (inputBaseHosted.includes(testCase.component))
        expect(control.getAttribute('aria-label')).toContain('Field label');
    });
  });

  it('is described by the messages row with the hint', async () => {
    const wrapper = await mountCase(testCase, new Field({ value: testCase.empty }));

    controlsOf(wrapper, testCase.controls).forEach((control) => {
      const [messages] = byIds(control.getAttribute('aria-describedby'));
      expect(messages.classList).toContain('v-input__details');
      expect(descriptionText(control)).toContain('Hint text');
    });
  });

  it('sets aria-invalid while errors are shown, and keeps the hint in the description', async () => {
    const control = requiredField(testCase.empty);
    const wrapper = await mountCase(testCase, control);
    controlsOf(wrapper, testCase.controls).forEach((element) => {
      expect(element.hasAttribute('aria-invalid')).toBe(false);
    });

    control.touched = true;
    await flushPromises();

    controlsOf(wrapper, testCase.controls).forEach((element) => {
      expect(element.getAttribute('aria-invalid')).toBe('true');
      const description = descriptionText(element);
      expect(description).toContain('Please enter a value');
      expect(description).toContain('Hint text');
    });
    // the hint is kept visually hidden while the error is drawn
    const details = (wrapper.element.parentElement as HTMLElement).querySelector('.v-input__details') as HTMLElement;
    expect(details.querySelector('.df-sr-only')?.textContent).toContain('Hint text');
    const drawn = details.cloneNode(true) as HTMLElement;
    drawn.querySelectorAll('.df-sr-only').forEach((element) => element.remove());
    expect(drawn.textContent).toContain('Please enter a value');
    expect(drawn.textContent).not.toContain('Hint text');

    control.value = testCase.filled;
    await flushPromises();

    controlsOf(wrapper, testCase.controls).forEach((element) => {
      expect(element.hasAttribute('aria-invalid')).toBe(false);
    });
  });
});

describe('df-datetime parts', () => {
  const datetime = cases.find((testCase) => testCase.name === 'df-datetime')!;

  it('names the date and the time input by the field label and the part', async () => {
    const wrapper = await mountCase(datetime, new Field({ value: null }));

    const [date, time] = controlsOf(wrapper, datetime.controls);
    expect(nameText(date)).toBe('Field label Date');
    expect(nameText(time)).toBe('Field label Time');
    expect(date.getAttribute('aria-label')).toBe('Field label Date');
    expect(time.getAttribute('aria-label')).toBe('Field label Time');
    // the field label's `for` is the date input
    expect(document.querySelector(`label[for="${date.id}"]`)?.textContent).toContain('Field label');
  });

  it('gives the inputs no name while the field has none', async () => {
    const wrapper = await mountCase(datetime, new Field({ value: null }));

    controlsOf(wrapper, datetime.controls).forEach((element) => {
      expect(element.hasAttribute('name')).toBe(false);
    });
  });

  it('names the time input of a time field by the field label', async () => {
    const wrapper = await mountCase(datetime, new Field({ value: null }), { inputType: 'time' });

    const [time] = controlsOf(wrapper, datetime.controls);
    expect(document.querySelector(`label[for="${time.id}"]`)?.textContent).toContain('Field label');
  });
});

describe('df-file stored file', () => {
  const file = cases.find((testCase) => testCase.name === 'df-file')!;

  it('is named by the field label and described by the stored file name', async () => {
    const wrapper = await mountCase(file, new Field({ value: 'contracts/agreement.pdf' }));

    const [input] = controlsOf(wrapper, file.controls);
    expect(nameText(input)).toBe('Field label');
    expect(descriptionText(input)).toContain('contracts/agreement.pdf');
    expect(input.getAttribute('aria-label')).toBe('Field label');
  });
});

describe('df-rtf-editor editable element', () => {
  const rtf = cases.find((testCase) => testCase.name === 'df-rtf-editor')!;

  it('is a multi-line text box, read-only while the field accepts no input', async () => {
    const control = new Field({ value: '' });
    const wrapper = await mountCase(rtf, control);

    const [editable] = controlsOf(wrapper, rtf.controls);
    expect(editable.getAttribute('aria-multiline')).toBe('true');
    expect(editable.hasAttribute('aria-readonly')).toBe(false);

    control.access = 'readonly';
    await flushPromises();
    expect(controlsOf(wrapper, rtf.controls)[0].getAttribute('aria-readonly')).toBe('true');
  });

  it("is the element the field label's for names, and takes the focus on a click on the label", async () => {
    const wrapper = await mountCase(rtf, new Field({ value: '' }));

    const [editable] = controlsOf(wrapper, rtf.controls);
    const label = document.querySelector<HTMLElement>('.v-field-label[for]')!;
    expect(label.getAttribute('for')).toBe(editable.id);

    label.click();
    // tiptap's focus command focuses in the next animation frame
    await vi.waitFor(() => expect(editable.contains(document.activeElement)).toBe(true));
  });
});
