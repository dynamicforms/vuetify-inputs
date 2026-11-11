import { Field, Group, ValidationError } from '@dynamicforms/vue-forms';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import DfCheckbox from '@/df-checkbox.vue';
import DfInputGroup from '@/df-input-group.vue';

const vuetify = createVuetify({ components, directives });

function mountGroup(props: Record<string, unknown>, children: () => any[] = () => []) {
  return mount(DfInputGroup, {
    props,
    slots: { default: children },
    global: { plugins: [vuetify] },
    attachTo: document.body,
  });
}

function days() {
  return new Group({ mon: new Field({ value: false }), tue: new Field({ value: false }) });
}

describe('DfInputGroup', () => {
  it('renders its label floating and its children inside the field', () => {
    const group = days();
    const wrapper = mountGroup({ control: group, label: 'Days', variant: 'outlined' }, () => [
      h(DfCheckbox, { control: group.fields.mon, label: 'Mon' }),
    ]);

    const field = wrapper.find('.v-field');
    expect(field.classes()).toContain('v-field--variant-outlined');
    expect(field.classes()).toContain('v-field--active');
    expect(wrapper.find('.v-field__input .v-checkbox').exists()).toBe(true);
    expect(wrapper.text()).toContain('Days');
    wrapper.unmount();
  });

  it('gives its children the plain variant and the inline density', () => {
    const group = days();
    const wrapper = mountGroup({ control: group, label: 'Days', variant: 'solo', density: 'compact' }, () => [
      h(DfCheckbox, { control: group.fields.mon, label: 'Mon' }),
    ]);

    expect(wrapper.find('.v-checkbox').classes()).toContain('df-density-inline');
    expect(wrapper.classes()).toContain('df-density-compact');
    wrapper.unmount();
  });

  it("shows the errors of the bound container's members and of the container itself", async () => {
    const group = days();
    group.errors.push(new ValidationError('app.no_day', {}, 'Choose a day', 'server'));
    group.fields.tue.errors.push(new ValidationError('app.closed', {}, 'Closed on Tuesday', 'server'));
    const wrapper = mountGroup({ control: group, label: 'Days' });
    await nextTick();

    const messages = wrapper.find('.v-input__details').text();
    expect(messages).toContain('Choose a day');
    expect(messages).toContain('Closed on Tuesday');
    expect(wrapper.find('.v-field').classes()).toContain('v-field--error');
    wrapper.unmount();
  });

  it('shows the hint while there is no error', () => {
    const wrapper = mountGroup({ control: days(), label: 'Days', hint: 'At least one' });

    expect(wrapper.find('.v-input__details').text()).toContain('At least one');
    expect(wrapper.find('.v-field').classes()).not.toContain('v-field--error');
    wrapper.unmount();
  });

  it('shows the errors prop without a control', () => {
    const wrapper = mountGroup({ label: 'Days', errors: [{ detail: 'Given', origin: 'server' }] });

    expect(wrapper.find('.v-input__details').text()).toContain('Given');
    wrapper.unmount();
  });

  it.each(['row', 'wrap', 'column'])('lays its children out by direction %s', (direction) => {
    const wrapper = mountGroup({ label: 'Days', direction });

    expect(wrapper.find('.df-input-group-content').classes()).toContain(`df-input-group--${direction}`);
    wrapper.unmount();
  });

  it('is focused while one of its children is', async () => {
    const group = days();
    const wrapper = mountGroup({ control: group, label: 'Days' }, () => [
      h(DfCheckbox, { control: group.fields.mon, label: 'Mon' }),
      h(DfCheckbox, { control: group.fields.tue, label: 'Tue' }),
    ]);
    const [mon, tue] = wrapper.findAll('input[type="checkbox"]');

    await mon.trigger('focusin');
    expect(wrapper.find('.v-field').classes()).toContain('v-field--focused');

    await mon.trigger('focusout', { relatedTarget: tue.element });
    expect(wrapper.find('.v-field').classes()).toContain('v-field--focused');

    await tue.trigger('focusout', { relatedTarget: document.body });
    expect(wrapper.find('.v-field').classes()).not.toContain('v-field--focused');
    wrapper.unmount();
  });

  it('renders nothing for a suppressed control', () => {
    const group = days();
    group.visibility = 'suppress';
    const wrapper = mountGroup({ control: group, label: 'Days' });

    expect(wrapper.find('.v-input').exists()).toBe(false);
    wrapper.unmount();
  });
});
