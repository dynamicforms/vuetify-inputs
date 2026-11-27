<template>
  <render />
</template>

<script setup lang="ts">
import { h, inject, mergeProps, resolveComponent, type VNodeChild } from 'vue';

import type { MessagesWidgetProps } from '../dynamicforms-component-props';

import { type ErrorInput, errorText } from './error-text';
import { renderMarkdown } from './markdown';
import { type MdString, RenderableValue, type RenderContentNonCallable } from './render-content';
import { type VuetifyInputsSettings, vuetifyInputsSettingsKey } from './settings';

const props = defineProps<MessagesWidgetProps>();
const settings = inject<VuetifyInputsSettings>(vuetifyInputsSettingsKey, {});

const htmlElements = new Set([
  'div',
  'span',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'section',
  'article',
  'aside',
  'nav',
  'header',
  'footer',
  'main',
  'figure',
  'figcaption',
  'blockquote',
  'pre',
  'code',
  'em',
  'strong',
  'small',
  'mark',
  'del',
  'ins',
  'sub',
  'sup',
  'i',
  'b',
  'u',
  's',
  'a',
  'img',
  'button',
  'input',
  'textarea',
  'select',
  'option',
  'label',
  'form',
  'table',
  'tr',
  'td',
  'th',
  'thead',
  'tbody',
  'tfoot',
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
]);

function asRenderable(msg: RenderableValue | ErrorInput): RenderableValue {
  return msg instanceof RenderableValue ? msg : new RenderableValue(errorText(msg, settings));
}

function renderComponent(name: string, bindings: Record<string, any>, children: readonly RenderContentNonCallable[]) {
  const childNodes = () => children.map(renderChild);
  // a common html element is rendered as itself, with the children as its own; any other name is resolved as a
  // registered component, with the children as its default slot
  if (htmlElements.has(name.toLowerCase())) return h(name, bindings, childNodes());
  return h(resolveComponent(name), bindings, children.length ? { default: childNodes } : undefined);
}

// a child of a component: text as a text node, an HtmlString in a span, so that it fits in an inline element
function renderChild(child: RenderContentNonCallable): VNodeChild {
  const msg = new RenderableValue(child);
  switch (msg.componentName) {
    case 'template':
      return msg.componentBody;
    case 'html':
      return h('span', { innerHTML: msg.componentBody });
    case 'vue-markdown':
      return h('div', {
        class: 'df-messages-widget-markdown',
        innerHTML: renderMarkdown(msg.resolvedText as MdString),
      });
    default:
      return renderComponent(msg.componentName, msg.componentBindings, msg.componentChildren);
  }
}

function attrsOf(item: RenderableValue | (() => RenderableValue), index: number) {
  const { itemAttrs } = props;
  if (typeof itemAttrs !== 'function') return itemAttrs;
  return itemAttrs(typeof item === 'function' ? item() : item, index);
}

// class, style and listeners add up as Vue merges props; any other key replaces the binding
function needsMerge(attrs: Record<string, unknown>) {
  return Object.keys(attrs).some((key) => key === 'class' || key === 'style' || /^on[A-Z]/.test(key));
}

function withAttrs(bindings: Record<string, any>, attrs: Record<string, unknown> | undefined): Record<string, any> {
  if (!attrs) return bindings;
  return needsMerge(attrs) ? mergeProps(bindings, attrs) : { ...bindings, ...attrs };
}

const render = () => {
  if (typeof props.message === 'string') {
    const text = props.message;
    const attrs = attrsOf(() => new RenderableValue(text), 0);
    return h('span', withAttrs({ class: props.classes }, attrs), text);
  }
  return props.message.map((item, index) => {
    const msg = asRenderable(item);
    const classes = [props.classes, msg.extraClasses];
    const attrs = attrsOf(msg, index);
    switch (msg.componentName) {
      case 'template':
        return h('div', withAttrs({ class: classes }, attrs), msg.componentBody);
      case 'html':
        return h('div', withAttrs({ class: classes, innerHTML: msg.componentBody }, attrs));
      case 'vue-markdown': {
        const bindings = withAttrs({ class: [...classes, 'df-messages-widget-markdown'] }, attrs);
        return h('div', { ...bindings, innerHTML: renderMarkdown(msg.resolvedText as MdString) });
      }
      default:
        return renderComponent(
          msg.componentName,
          withAttrs({ ...msg.componentBindings, class: [classes, msg.componentBindings.class] }, attrs),
          msg.componentChildren,
        );
    }
  });
};
</script>

<style>
/* no margins for markdown at the very top and very bottom */
.df-messages-widget-markdown > :first-child,
.df-messages-widget-markdown > :last-child {
  margin-top: 0 !important;
  padding-top: 0 !important;
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
  line-height: 1.35em !important;
}
</style>
