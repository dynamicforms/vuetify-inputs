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
import { computed, inject } from 'vue';
import { CachedIcon } from 'vue-cached-icon';

import type { DfLabelProps } from '../dynamicforms-component-props';

import { Label } from './input-base';
import { inputContextKey } from './input-context';
import MessagesWidget from './messages-widget.vue';
import { RenderableValue } from './render-content';

const props = defineProps<DfLabelProps>();

const input = inject(inputContextKey, null);
const label = computed(() => props.label ?? input?.label.value ?? new Label(''));

// the label's own content: the slot data holds only its text, which Vuetify is given
const lbl = computed(() => label.value.text || props.data?.label || '');
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
</style>
