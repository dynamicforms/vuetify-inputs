<template>
  <div class="df-label" :class="{ 'allow-wrap': allowWrap }">
    <template v-if="label.icon">
      <cached-icon v-if="label.iconComponent === 'v-icon'" :name="label.icon" size="1.25em" />
      <v-img v-else-if="label.iconComponent === 'v-img'" class="icon" :src="label.icon" />
      <component :is="label.iconComponent" v-else :src="label.icon" />
    </template>
    <template v-if="typeof lbl === 'string'">{{ lbl }}</template>
    <messages-widget v-else :message="[content]" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CachedIcon } from 'vue-cached-icon';

import type { DfLabelProps } from '../dynamicforms-component-props';

import MessagesWidget from './messages-widget.vue';
import { RenderableValue } from './render-content';

const props = defineProps<DfLabelProps>();

// the label's own content: the slot data holds only its text, which Vuetify is given
const lbl = computed(() => props.label.text || props.data?.label || '');
const content = computed(() => new RenderableValue(lbl.value));
</script>

<style>
.df-label {
  display: flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
  justify-content: flex-start;
}

.df-label.allow-wrap {
  white-space: initial;
}

.df-label .icon {
  width: 1.25em;
}

.df-label .df-messages-widget-markdown :first-child,
.df-label .df-messages-widget-markdown :last-child {
  margin-top: 0 !important;
  padding-top: 0 !important;
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
  line-height: 1.35em !important; /* inspired by vitepress' aggressive settings */
}
</style>
