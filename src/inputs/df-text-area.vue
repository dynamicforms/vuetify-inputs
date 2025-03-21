<template>
  <div class="container">
    <v-textarea
      v-model="value"
      variant="underlined"

      :rows="rows"
      :auto-grow="(maxRows || 0) > 0"
      :max-rows="maxRows"
      v-bind="vuetifyBindings"
    />
  </div>
</template>

<script setup lang="ts">
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
</script>

<style scoped>
.container {
  width: 100%;
}
</style>
