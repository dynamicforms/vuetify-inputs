import Form from '@dynamicforms/vue-forms';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import DfCheckbox from '@/df-checkbox.vue';
import DfColor from '@/df-color.vue';
import DfDateTime from '@/df-datetime.vue';
import DfFile from '@/df-file.vue';
import DfImage from '@/df-image.vue';
import DfInput from '@/df-input.vue';
import DfRtfEditor from '@/df-rtf-editor.vue';
import DfSelect from '@/df-select.vue';
import DfTextArea from '@/df-text-area.vue';
import { makeComms } from '@/test-utils/files';

vi.mock('@/helpers/rtf-editor/editor-core.vue', () => ({
  default: {
    template: '<div class="ck-editor-stub" />',
    props: ['modelValue', 'minHeight', 'disabled'],
  },
}));

const comms = makeComms();

const inputComponents: [string, any, Record<string, any>][] = [
  ['DfCheckbox', DfCheckbox, {}],
  ['DfColor', DfColor, {}],
  ['DfDateTime', DfDateTime, {}],
  ['DfFile', DfFile, { comms }],
  ['DfImage', DfImage, { comms }],
  ['DfInput', DfInput, {}],
  ['DfRtfEditor', DfRtfEditor, {}],
  ['DfSelect', DfSelect, {}],
  ['DfTextArea', DfTextArea, {}],
];

describe('DisplayMode visibility', () => {
  const mountWith = (component: any, props: Record<string, any>) => mount(component, { props });
  const withControl = (visibility: Form.Visibility, extraProps: Record<string, any>) => ({
    control: new Form.Field({ value: null, visibility }),
    label: 'Test Label',
    ...extraProps,
  });

  describe.each(inputComponents)('%s', (_name, component, extraProps) => {
    it('renders nothing when control visibility is SUPPRESS', () => {
      const wrapper = mountWith(component, withControl('suppress', extraProps));

      expect(wrapper.find('.v-input').exists()).toBe(false);
      expect(wrapper.html()).toBe('<!--v-if-->');
    });

    it("renders with the d-none class when control visibility is 'hidden'", () => {
      const wrapper = mountWith(component, withControl('hidden', extraProps));

      expect(wrapper.find('.v-input').exists()).toBe(true);
      expect(wrapper.classes()).toContain('d-none');
      expect(wrapper.classes()).not.toContain('invisible');
    });

    it("renders with the invisible class when control visibility is 'invisible'", () => {
      const wrapper = mountWith(component, withControl('invisible', extraProps));

      expect(wrapper.find('.v-input').exists()).toBe(true);
      expect(wrapper.classes()).toContain('invisible');
      expect(wrapper.classes()).not.toContain('d-none');
    });

    it('renders without visibility classes when control visibility is FULL', () => {
      const wrapper = mountWith(component, withControl('full', extraProps));

      expect(wrapper.find('.v-input').exists()).toBe(true);
      expect(wrapper.classes()).not.toContain('d-none');
    });

    it('falls back to the visibility prop when no control is bound', () => {
      const wrapper = mountWith(component, { visibility: 'hidden', label: 'Test Label', ...extraProps });

      expect(wrapper.classes()).toContain('d-none');
    });

    it('takes visibility from the control when the prop says otherwise', () => {
      const wrapper = mountWith(component, { ...withControl('full', extraProps), visibility: 'suppress' });

      expect(wrapper.find('.v-input').exists()).toBe(true);
      expect(wrapper.classes()).not.toContain('d-none');
    });

    it('reacts to control visibility changes', async () => {
      const props = withControl('full', extraProps);
      const wrapper = mountWith(component, props);
      const { control } = props;

      expect(wrapper.classes()).not.toContain('d-none');

      control.visibility = 'hidden';
      await wrapper.vm.$nextTick();

      expect(wrapper.classes()).toContain('d-none');

      control.visibility = 'suppress';
      await wrapper.vm.$nextTick();

      expect(wrapper.html()).toBe('<!--v-if-->');
    });
  });
});
