<template>
  <div class="container">
    <v-textarea
      v-if="visibility !== DisplayMode.SUPPRESS"
      v-model="value"
      :class="[
        cssClass,
        {
          'd-none': visibility === DisplayMode.HIDDEN,
          invisible: visibility === DisplayMode.INVISIBLE,
        },
      ]"
      variant="underlined"

      :rows="rows"
      :auto-grow="(maxRows || 0) > 0"
      :max-rows="maxRows"
      v-bind="vuetifyBindings"
    />
  </div>
</template>

<script setup lang="ts">
import { DisplayMode } from '@dynamicforms/vue-forms';
import { toRefs } from 'vue';

import { BaseEmits, BaseProps, defaultBaseProps, useInputBase } from './helpers';

interface Props extends BaseProps {
  rows?: number;
  maxRows?: number;
}
const props = withDefaults(defineProps<Props>(), {
  ...defaultBaseProps,
  rows: undefined,
  maxRows: undefined,
});

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const { value, vuetifyBindings } = useInputBase(props, emits);
const { cssClass, visibility } = toRefs(props);
</script>

<style scoped>
.container {
  width: 100%;
}
</style>
