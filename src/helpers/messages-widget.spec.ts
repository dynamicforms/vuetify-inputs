import { ValidationError, Validators, Field } from '@dynamicforms/vue-forms';
import { mount } from '@vue/test-utils';
import MarkdownItAttrs from 'markdown-it-attrs';
import { describe, expect, it } from 'vitest';

import MessagesWidget from './messages-widget.vue';
import { MdString, RenderableValue } from './render-content';
import { vuetifyInputsSettingsKey, type VuetifyInputsSettings } from './settings';
import { translateStrings } from './translations';

const MockCustomAlert = {
  name: 'CustomAlert',
  props: ['type', 'dismissible'],
  template: '<div class="custom-alert-mock" :type="$props.type" :dismissible="$props.dismissible"></div>',
};

function buildWrapper(props: any, settings: VuetifyInputsSettings = {}) {
  return mount(MessagesWidget, {
    props,
    global: { components: { CustomAlert: MockCustomAlert }, provide: { [vuetifyInputsSettingsKey]: settings } },
  });
}

describe('MessagesWidget', () => {
  it('renders a plain message in a span with the classes', () => {
    const wrapper = buildWrapper({ message: 'Simple error message', classes: ['text-error', 'extra'] });

    expect(wrapper.find('span').text()).toBe('Simple error message');
    expect(wrapper.find('span').classes()).toEqual(['text-error', 'extra']);
  });

  it('renders each RenderableValue in its own div with its own classes', () => {
    const message = [new RenderableValue('First', 'class-1'), new RenderableValue('Second', 'class-2')];

    const divs = buildWrapper({ message, classes: 'text-error' }).findAll('div');

    expect(divs.map((d) => d.text())).toEqual(['First', 'Second']);
    expect(divs[0].classes()).toEqual(['text-error', 'class-1']);
  });

  it('renders markdown through vue-markdown-render, with its plugins', () => {
    const md = new MdString('**Bold** [link](https://example.com){target="_blank"}', undefined, [MarkdownItAttrs]);

    const markdown = buildWrapper({ message: [new RenderableValue(md)], classes: 'text-error' }).find(
      '.df-messages-widget-markdown',
    );

    expect(markdown.element.innerHTML.replaceAll('\n', '')).toBe(
      '<p><strong>Bold</strong> <a href="https://example.com" target="_blank">link</a></p>',
    );
    expect(markdown.classes()).toContain('text-error');
  });

  it('renders a component definition with its props', () => {
    const message = [new RenderableValue({ componentName: 'custom-alert', componentProps: { type: 'warning' } })];

    const alert = buildWrapper({ message }).find('.custom-alert-mock');

    expect(alert.attributes('type')).toBe('warning');
    expect(alert.element.innerHTML).toBe('');
  });

  it('renders a validator error as the text of its code, with its params', () => {
    const field = new Field({ value: 3, validators: [new Validators.MinValue(5)] });

    expect(buildWrapper({ message: field.errors }).text()).toBe('Value must be larger or equal to 5');
  });

  it('renders the detail of an error whose code has no entry', () => {
    const message = [new ValidationError('name_taken', {}, 'This name is taken', 'server')];

    expect(buildWrapper({ message }).text()).toBe('This name is taken');
  });

  it('renders the translation of the code', () => {
    translateStrings((key, defaultValue) => (key === 'required' ? 'Vnesite vrednost' : defaultValue));
    try {
      const message = [new ValidationError('required', {}, 'Please enter a value')];
      expect(buildWrapper({ message }).text()).toBe('Vnesite vrednost');
    } finally {
      translateStrings((_key, defaultValue) => defaultValue);
    }
  });

  it('renders what the errorText setting answers, and the default where it answers undefined', () => {
    const settings: VuetifyInputsSettings = {
      errorText: (error) => (error.code === 'required' ? new MdString('**Required**') : undefined),
    };
    const message = [new ValidationError('required', {}, 'x'), new ValidationError('other', {}, 'Other detail')];

    const wrapper = buildWrapper({ message }, settings);

    expect(wrapper.find('.df-messages-widget-markdown strong').text()).toBe('Required');
    expect(wrapper.text()).toContain('Other detail');
  });

  it('joins an array param', () => {
    const field = new Field({ value: 'x', validators: [new Validators.InAllowedValues(['a', 'b'])] });

    expect(buildWrapper({ message: field.errors }).text()).toBe('Must be one of [a, b]');
  });
});
