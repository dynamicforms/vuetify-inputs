<template>
  <div class="label">
    <template v-if="label.icon">
      <v-icon v-if="label.iconComponent === 'v-icon'" :icon="label.icon" size="1.25em"/>
      <v-img v-else-if="label.iconComponent === 'v-img'" class="icon" :src="label.icon"/>
      <component :is="label.iconComponent" v-else :src="label.icon"/>
    </template>
    {{ data ? data.label : label.text }}
  </div>
</template>

<script setup lang="ts">
import { DefaultInputSlot } from 'vuetify/lib/components/VField/VField';

import { Label } from './input-base';

defineProps<{
  data?: DefaultInputSlot & { label?: string };
  label: Label;
}>();
</script>

<style scoped>
.label {
  display: flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
  justify-content: flex-start;
}

.label .icon {
  width: 1.25em;
}
</style>
