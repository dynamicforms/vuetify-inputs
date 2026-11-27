import { ValidationError, Validators, Field } from '@dynamicforms/vue-forms';
import { mount } from '@vue/test-utils';
import MarkdownItAttrs from 'markdown-it-attrs';
import { describe, expect, it } from 'vitest';

import MessagesWidget from './messages-widget.vue';
import { HtmlString, MdString, RenderableValue, renderContentText, type SimpleComponentDef } from './render-content';
import { vuetifyInputsSettingsKey, type VuetifyInputsSettings } from './settings';

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

  it('renders markdown through markdown-it, with its plugins', () => {
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

  describe('component children', () => {
    const MockCustomCard = { name: 'CustomCard', template: '<section class="custom-card-mock"><slot /></section>' };

    function buildChildrenWrapper(content: SimpleComponentDef) {
      return mount(MessagesWidget, {
        props: { message: [new RenderableValue(content)] },
        global: { components: { CustomCard: MockCustomCard }, provide: { [vuetifyInputsSettingsKey]: {} } },
      });
    }

    it('renders a string child of an element as escaped text', () => {
      const wrapper = buildChildrenWrapper({
        componentName: 'a',
        componentProps: { href: '/details' },
        children: '<b>Details</b>',
      });

      expect(wrapper.find('a[href="/details"]').text()).toBe('<b>Details</b>');
      expect(wrapper.find('a b').exists()).toBe(false);
    });

    it('renders an array of children in order, each in its own form', () => {
      const wrapper = buildChildrenWrapper({
        componentName: 'p',
        children: [
          'Read ',
          { componentName: 'a', componentProps: { href: '/docs' }, children: 'the docs' },
          new HtmlString(' <i>first</i>'),
          new MdString('**now**'),
        ],
      });

      const p = wrapper.find('p');
      expect(p.find('a[href="/docs"]').text()).toBe('the docs');
      expect(p.find('span > i').text()).toBe('first');
      expect(p.find('.df-messages-widget-markdown strong').text()).toBe('now');
      expect(p.text().startsWith('Read the docs')).toBe(true);
    });

    it('renders the children of a registered component as its default slot', () => {
      const wrapper = buildChildrenWrapper({
        componentName: 'custom-card',
        children: { componentName: 'em', children: 'Hi' },
      });

      expect(wrapper.find('.custom-card-mock > em').text()).toBe('Hi');
    });

    it('passes a listener prop to the element', async () => {
      let clicks = 0;
      const wrapper = buildChildrenWrapper({
        componentName: 'button',
        componentProps: { onClick: () => (clicks += 1) },
        children: 'Retry',
      });

      await wrapper.find('button').trigger('click');

      expect(clicks).toBe(1);
    });

    it('reads the text of a component as the text of its children', () => {
      const content: SimpleComponentDef = {
        componentName: 'p',
        children: ['Read ', { componentName: 'a', children: 'the docs' }, new HtmlString(' <i>first</i>')],
      };

      expect(renderContentText(content)).toBe('Read the docs first');
      expect(renderContentText({ componentName: 'p', children: [new HtmlString('&nbsp;x'), ' y '] })).toBe(' x y');
      expect(renderContentText({ componentName: 'v-icon' })).toBe('');
    });
  });

  it('renders a validator error as its detail', () => {
    const field = new Field({ value: 3, validators: [new Validators.MinValue(5)] });

    expect(buildWrapper({ message: field.errors }).text()).toBe('Value must be larger or equal to 5');
  });

  it('renders a server error as its detail', () => {
    const message = [new ValidationError('name_taken', {}, 'This name is taken', 'server')];

    expect(buildWrapper({ message }).text()).toBe('This name is taken');
  });

  it('renders what the errorText setting answers, and the default where it answers undefined', () => {
    const settings: VuetifyInputsSettings = {
      errorText: (error) => (error.code === 'vue-forms.required' ? new MdString('**Required**') : undefined),
    };
    const message = [
      new ValidationError('vue-forms.required', {}, 'x'),
      new ValidationError('other', {}, 'Other detail'),
    ];

    const wrapper = buildWrapper({ message }, settings);

    expect(wrapper.find('.df-messages-widget-markdown strong').text()).toBe('Required');
    expect(wrapper.text()).toContain('Other detail');
  });

  it('joins an array param', () => {
    const field = new Field({ value: 'x', validators: [new Validators.InAllowedValues(['a', 'b'])] });

    expect(buildWrapper({ message: field.errors }).text()).toBe('Must be one of [a, b]');
  });

  describe('HTML', () => {
    it('renders an HtmlString as the inner HTML of a div', () => {
      const wrapper = buildWrapper({ message: [new RenderableValue(new HtmlString('<b>bold</b>'))] });

      expect(wrapper.find('div b').text()).toBe('bold');
    });

    it('renders a plain string as text', () => {
      const wrapper = buildWrapper({ message: [new RenderableValue('<b>bold</b>')] });

      expect(wrapper.find('b').exists()).toBe(false);
      expect(wrapper.text()).toBe('<b>bold</b>');
    });

    it('keeps the widget classes beside a class in the props of a component definition', () => {
      const content = { componentName: 'span', componentProps: { class: 'own' } };
      const wrapper = buildWrapper({ message: [new RenderableValue(content)], classes: 'text-error' });

      expect(wrapper.find('span').classes()).toEqual(['text-error', 'own']);
    });

    it('separates the blocks of an HtmlString by a space', () => {
      expect(renderContentText(new HtmlString('<h1>Title</h1><p>One<br>two <b>bo</b>ld</p>'))).toBe(
        'Title One two bold',
      );
    });

    it('reads an &nbsp; of an HtmlString as a space that is neither collapsed nor trimmed', () => {
      expect(renderContentText(new HtmlString('&nbsp;x'))).toBe(' x');
      expect(renderContentText(new HtmlString(' a&nbsp;&nbsp;b&nbsp; '))).toBe('a  b ');
    });

    it('reads the text of an HtmlString without tags and with its entities read', () => {
      expect(renderContentText(new HtmlString('<b>a &amp; b &lt;c&gt;</b>&amp;lt;'))).toBe('a & b <c>&lt;');
    });

    it('drops innerHTML from the props of a component definition', () => {
      const content = { componentName: 'div', componentProps: { innerHTML: '<b>bold</b>', title: 't' } } as any;
      const wrapper = buildWrapper({ message: [new RenderableValue(content)] });

      expect(wrapper.find('b').exists()).toBe(false);
      expect(wrapper.find('div').attributes('title')).toBe('t');
    });
  });

  describe('errors as strings and partial descriptions', () => {
    const errorText = () => 'from errorText';

    it('renders a string item as it is, without asking errorText', () => {
      const divs = buildWrapper({ message: ['Already translated'] }, { errorText }).findAll('div');

      expect(divs.map((d) => d.text())).toEqual(['Already translated']);
    });

    it('renders an MdString item as markdown, without asking errorText', () => {
      const wrapper = buildWrapper({ message: [new MdString('**Already** translated')] }, { errorText });

      expect(wrapper.find('strong').text()).toBe('Already');
    });

    it('renders HtmlString and component items as they are, without asking errorText', () => {
      const message = [new HtmlString('<em>HTML</em>'), { componentName: 'span', componentProps: { class: 'custom' } }];
      const wrapper = buildWrapper({ message }, { errorText });

      expect(wrapper.find('em').text()).toBe('HTML');
      expect(wrapper.find('span.custom').exists()).toBe(true);
    });

    it('renders an error without a code as its detail, without asking errorText', () => {
      const divs = buildWrapper({ message: [{ detail: 'Only a detail' }] }, { errorText }).findAll('div');

      expect(divs.map((d) => d.text())).toEqual(['Only a detail']);
    });

    it('asks errorText for an error with a code, with the missing members defaulted', () => {
      let asked: unknown;
      const settings: VuetifyInputsSettings = {
        errorText: (error) => {
          asked = error;
          return undefined;
        },
      };

      const divs = buildWrapper({ message: [{ code: 'taken' }] }, settings).findAll('div');

      expect(asked).toEqual({ code: 'taken', params: {}, detail: '', origin: 'application' });
      expect(divs.map((d) => d.text())).toEqual(['']);
    });
  });

  describe('itemAttrs', () => {
    const attrs = { role: 'cell', 'aria-label': 'Label' };

    it('binds the attributes on the span of a plain message, as item 0', () => {
      let asked: [string, number] | undefined;
      const itemAttrs = (item: RenderableValue, index: number) => {
        asked = [item.componentBody as string, index];
        return attrs;
      };
      const span = buildWrapper({ message: 'Plain', classes: 'text-error', itemAttrs }).find('span');

      expect(asked).toEqual(['Plain', 0]);
      expect(span.attributes('role')).toBe('cell');
      expect(span.attributes('aria-label')).toBe('Label');
      expect(span.classes()).toEqual(['text-error']);
    });

    it('binds the attributes on the div of a text item', () => {
      const div = buildWrapper({ message: [new RenderableValue('Text', 'own')], classes: 'w', itemAttrs: attrs }).find(
        'div',
      );

      expect(div.attributes('role')).toBe('cell');
      expect(div.text()).toBe('Text');
      expect(div.classes()).toEqual(['w', 'own']);
    });

    it('binds the attributes on the div of an HTML item', () => {
      const wrapper = buildWrapper({ message: [new HtmlString('<b>bold</b>')], itemAttrs: attrs });

      expect(wrapper.find('div[role="cell"] b').text()).toBe('bold');
    });

    it('binds the attributes on the markdown wrapper', () => {
      const wrapper = buildWrapper({ message: [new MdString('**md**')], classes: 'w', itemAttrs: attrs });
      const markdown = wrapper.find('.df-messages-widget-markdown');

      expect(markdown.attributes('role')).toBe('cell');
      expect(markdown.classes()).toEqual(expect.arrayContaining(['w', 'df-messages-widget-markdown']));
      expect(markdown.find('strong').text()).toBe('md');
    });

    it('binds the attributes on an html element of a component definition, merged with its props', () => {
      const content = { componentName: 'span', componentProps: { class: 'own', title: 't', role: 'note' } };
      const wrapper = buildWrapper({
        message: [new RenderableValue(content)],
        classes: 'w',
        itemAttrs: { ...attrs, class: 'extra' },
      });
      const span = wrapper.find('span');

      expect(span.classes()).toEqual(['w', 'own', 'extra']);
      expect(span.attributes('title')).toBe('t');
      expect(span.attributes('role')).toBe('cell');
      expect(span.attributes('aria-label')).toBe('Label');
    });

    it('replaces an attribute of the item and keeps its classes and styles', () => {
      const content = { componentName: 'span', componentProps: { class: 'own', style: 'color: red', title: 'own' } };
      const itemAttrs = Object.freeze({ title: 'attrs' });
      const span = buildWrapper({ message: [new RenderableValue(content)], classes: 'w', itemAttrs }).find('span');

      expect(span.attributes('title')).toBe('attrs');
      expect(span.classes()).toEqual(['w', 'own']);
      expect(span.attributes('style')).toContain('color: red');
    });

    it('adds a style of the attributes to the style of the item', () => {
      const content = { componentName: 'span', componentProps: { style: { color: 'red' } } };
      const itemAttrs = { style: { fontWeight: 'bold' } };
      const span = buildWrapper({ message: [new RenderableValue(content)], itemAttrs }).find('span');

      expect(span.attributes('style')).toContain('color: red');
      expect(span.attributes('style')).toContain('font-weight: bold');
    });

    it('binds the attributes on a registered component, beside its props', () => {
      const message = [new RenderableValue({ componentName: 'custom-alert', componentProps: { type: 'warning' } })];

      const alert = buildWrapper({ message, itemAttrs: attrs }).find('.custom-alert-mock');

      expect(alert.attributes('type')).toBe('warning');
      expect(alert.attributes('role')).toBe('cell');
    });

    it('calls both the item listener and the itemAttrs listener', async () => {
      const calls: string[] = [];
      const content = { componentName: 'button', componentProps: { onClick: () => calls.push('own') } };
      const wrapper = buildWrapper({
        message: [new RenderableValue(content)],
        itemAttrs: { onClick: () => calls.push('attrs') },
      });

      await wrapper.find('button').trigger('click');

      expect(calls).toEqual(['own', 'attrs']);
    });

    it('does not bind the attributes on the children of a component', () => {
      const content = { componentName: 'p', children: [{ componentName: 'em', children: 'child' }] };
      const wrapper = buildWrapper({ message: [new RenderableValue(content)], itemAttrs: attrs });

      expect(wrapper.find('p').attributes('role')).toBe('cell');
      expect(wrapper.find('em').attributes('role')).toBeUndefined();
    });

    it('gives the function each item with its index, an error as its text', () => {
      const asked: [string, number][] = [];
      const message = [new RenderableValue('First'), new ValidationError('x', {}, 'Second detail')];
      const itemAttrs = (item: RenderableValue, index: number) => {
        asked.push([item.componentBody as string, index]);
        return index === 0 ? { 'aria-colindex': index + 1 } : undefined;
      };

      const divs = buildWrapper({ message, itemAttrs }).findAll('div');

      expect(asked).toEqual([
        ['First', 0],
        ['Second detail', 1],
      ]);
      expect(divs[0].attributes('aria-colindex')).toBe('1');
      expect(divs[1].attributes('aria-colindex')).toBeUndefined();
      expect(divs[1].text()).toBe('Second detail');
    });
  });
});
