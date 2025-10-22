<template>
  <div class="df-label" :class="{ 'allow-wrap': allowWrap }">
    <template v-if="label.icon">
      <cached-icon v-if="label.iconComponent === 'v-icon'" :name="label.icon" size="1.25em" />
      <v-img v-else-if="label.iconComponent === 'v-img'" class="icon" :src="label.icon" />
      <component :is="label.iconComponent" v-else :src="label.icon" />
    </template>
    <vue-markdown
      v-if="lbl instanceof MdString"
      class="markdown"
      :source="lbl.toString()"
      :plugins="[markdownItAttrs]"
    />
    <template v-else>{{ lbl }}</template>
  </div>
</template>

<script setup lang="ts">
import { MdString } from '@dynamicforms/vue-forms';
import markdownItAttrs from 'markdown-it-attrs';
import { computed } from 'vue';
import { CachedIcon } from 'vue-cached-icon';
import VueMarkdown from 'vue-markdown-render';
import { DefaultInputSlot } from 'vuetify/lib/components/VField/VField';

import { Label } from './input-base';

const props = defineProps<{
  data?: DefaultInputSlot & { label?: string | MdString };
  label: Label;
  allowWrap?: boolean;
}>();

const lbl = computed(() => (props.data ? props.data.label : props.label.text));
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

.df-label .markdown :first-child,
.df-label .markdown :last-child {
  margin-top: 0 !important;
  padding-top: 0 !important;
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
  line-height: 1.35em !important; /* inspired by vitepress' aggressive settings */
}
</style>
