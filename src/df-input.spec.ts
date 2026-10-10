import { Field, Validators } from '@dynamicforms/vue-forms';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import DfInput from '@/df-input.vue';

const vuetify = createVuetify({ components, directives });

describe('DfInput', () => {
  it.each(['text', 'number'] as const)('marks its control touched on blur, as a %s input', async (inputType) => {
    const control = new Field({ value: inputType === 'number' ? 5 : 'x', validators: [new Validators.MinValue(10)] });
    const wrapper = mount(DfInput, { props: { control, inputType }, global: { plugins: [vuetify] } });
    expect(control.touched).toBe(false);

    await wrapper.find('input').trigger('blur');

    expect(control.touched).toBe(true);
  });
});
