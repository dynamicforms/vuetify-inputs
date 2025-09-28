<template>
  <div class="df-label">
    <template v-if="label.icon">
      <cached-icon v-if="label.iconComponent === 'v-icon'" :name="label.icon" size="1.25em" />
      <v-img v-else-if="label.iconComponent === 'v-img'" class="icon" :src="label.icon" />
      <component :is="label.iconComponent" v-else :src="label.icon" />
    </template>
    {{ data ? data.label : label.text }}
  </div>
</template>

<script setup lang="ts">
import { CachedIcon } from 'vue-cached-icon';
import { DefaultInputSlot } from 'vuetify/lib/components/VField/VField';

import { Label } from './input-base';

defineProps<{
  data?: DefaultInputSlot & { label?: string };
  label: Label;
}>();
</script>

<style>
.df-label {
  display: flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
  justify-content: flex-start;
}

.df-label .icon {
  width: 1.25em;
}
</style>
