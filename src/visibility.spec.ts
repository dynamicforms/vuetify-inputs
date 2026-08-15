import Form from '@dynamicforms/vue-forms';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';

import DfCheckbox from '@/df-checkbox.vue';
import DfColor from '@/df-color.vue';
import DfDateTime from '@/df-datetime.vue';
import DfFile from '@/df-file.vue';
import DfInput from '@/df-input.vue';
import DfRtfEditor from '@/df-rtf-editor.vue';
import DfSelect from '@/df-select.vue';
import DfTextArea from '@/df-text-area.vue';
import { FileComms } from '@/helpers';

vi.mock('@/helpers/ck-editor-custom.vue', () => ({
  default: {
    template: '<div class="ck-editor-stub" />',
    props: ['modelValue', 'minHeight', 'disabled'],
  },
}));

const comms: FileComms = {
  upload: vi.fn(async () => 'file-id'),
  delete: vi.fn(async () => {}),
  touch: vi.fn(async () => {}),
};

const inputComponents: [string, any, Record<string, any>][] = [
  ['DfCheckbox', DfCheckbox, {}],
  ['DfColor', DfColor, {}],
  ['DfDateTime', DfDateTime, {}],
  ['DfFile', DfFile, { comms }],
  ['DfInput', DfInput, {}],
  ['DfRtfEditor', DfRtfEditor, {}],
  ['DfSelect', DfSelect, {}],
  ['DfTextArea', DfTextArea, {}],
];

describe('DisplayMode visibility', () => {
  let vuetify: any;

  beforeEach(() => {
    vuetify = createVuetify({ components });
  });

  const mountWith = (component: any, extraProps: Record<string, any>, visibility: Form.DisplayMode) => {
    const control = new Form.Field({ value: null, visibility });
    return mount(component, {
      props: { control, label: 'Test Label', ...extraProps },
      global: { plugins: [vuetify] },
    });
  };

  describe.each(inputComponents)('%s', (_name, component, extraProps) => {
    it('renders nothing when control visibility is SUPPRESS', () => {
      const wrapper = mountWith(component, extraProps, Form.DisplayMode.SUPPRESS);

      expect(wrapper.find('.v-input').exists()).toBe(false);
      expect(wrapper.html()).toBe('<!--v-if-->');
    });

    it('renders with the d-none class when control visibility is HIDDEN', () => {
      const wrapper = mountWith(component, extraProps, Form.DisplayMode.HIDDEN);

      expect(wrapper.find('.v-input').exists()).toBe(true);
      expect(wrapper.classes()).toContain('d-none');
      expect(wrapper.classes()).not.toContain('invisible');
    });

    it('renders with the invisible class when control visibility is INVISIBLE', () => {
      const wrapper = mountWith(component, extraProps, Form.DisplayMode.INVISIBLE);

      expect(wrapper.find('.v-input').exists()).toBe(true);
      expect(wrapper.classes()).toContain('invisible');
      expect(wrapper.classes()).not.toContain('d-none');
    });

    it('renders without visibility classes when control visibility is FULL', () => {
      const wrapper = mountWith(component, extraProps, Form.DisplayMode.FULL);

      expect(wrapper.find('.v-input').exists()).toBe(true);
      expect(wrapper.classes()).not.toContain('d-none');
      expect(wrapper.classes()).not.toContain('invisible');
    });

    it('falls back to the visibility prop when no control is bound', () => {
      const wrapper = mount(component, {
        props: { visibility: Form.DisplayMode.HIDDEN, label: 'Test Label', ...extraProps },
        global: { plugins: [vuetify] },
      });

      expect(wrapper.classes()).toContain('d-none');
    });

    it('takes visibility from the control when the prop says otherwise', () => {
      const control = new Form.Field({ value: null, visibility: Form.DisplayMode.FULL });
      const wrapper = mount(component, {
        props: { control, visibility: Form.DisplayMode.SUPPRESS, label: 'Test Label', ...extraProps },
        global: { plugins: [vuetify] },
      });

      expect(wrapper.find('.v-input').exists()).toBe(true);
      expect(wrapper.classes()).not.toContain('d-none');
    });

    it('reacts to control visibility changes', async () => {
      const control = new Form.Field({ value: null, visibility: Form.DisplayMode.FULL });
      const wrapper = mount(component, {
        props: { control, label: 'Test Label', ...extraProps },
        global: { plugins: [vuetify] },
      });

      expect(wrapper.classes()).not.toContain('d-none');

      control.visibility = Form.DisplayMode.HIDDEN;
      await wrapper.vm.$nextTick();

      expect(wrapper.classes()).toContain('d-none');

      control.visibility = Form.DisplayMode.SUPPRESS;
      await wrapper.vm.$nextTick();

      expect(wrapper.html()).toBe('<!--v-if-->');
    });
  });
});
