<template>
  <render />
</template>

<script setup lang="ts">
import type { ErrorDescription } from '@dynamicforms/vue-forms';
import { h, inject, resolveComponent } from 'vue';
import VueMarkdown from 'vue-markdown-render';

import type { MessagesWidgetProps } from '../dynamicforms-component-props';

import { errorText } from './error-text';
import { RenderableValue } from './render-content';
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

function asRenderable(msg: RenderableValue | ErrorDescription): RenderableValue {
  return msg instanceof RenderableValue ? msg : new RenderableValue(errorText(msg, settings));
}

const render = () => {
  if (typeof props.message === 'string') return h('span', { class: props.classes }, props.message);
  return props.message.map((item) => {
    const msg = asRenderable(item);
    const classes = [props.classes, msg.extraClasses];
    switch (msg.componentName) {
      case 'template':
        return h('div', { class: classes }, msg.componentBody);
      case 'vue-markdown': {
        const { source, options, plugins } = msg.componentBindings;
        return h(VueMarkdown, { class: [...classes, 'df-messages-widget-markdown'], source, options, plugins });
      }
      default:
        return h(
          // a common html element is rendered as itself; any other name is resolved as a registered component
          htmlElements.has(msg.componentName.toLowerCase()) ? msg.componentName : resolveComponent(msg.componentName),
          {
            class: classes,
            ...msg.componentBindings,
            ...(msg.componentBody ? { innerHTML: msg.componentBody } : {}),
          },
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
  line-height: 1.35em !important; /* inspired by vitepress' aggressive settings */
}
</style>
