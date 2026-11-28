<template>
  <!-- the icon is Vuetify's: the field provides its clearIcon as the VIcon default -->
  <button type="button" class="df-clear-button" v-bind="clearControlProps(field, label)">
    <v-icon />
  </button>
</template>

<script setup lang="ts">
import { clearControlProps, type FieldClearProps } from './clear-control';

defineProps<{ field: FieldClearProps; label: string }>();
</script>

<style>
.df-clear-button {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: inherit;
  cursor: pointer;
}

.df-clear-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 1px;
}

.v-field__clearable > .df-clear-button > .v-icon {
  opacity: var(--v-medium-emphasis-opacity);
}

.v-field--error:not(.v-field--disabled) .v-field__clearable > .df-clear-button > .v-icon {
  opacity: 1;
  color: rgb(var(--v-theme-error));
}
</style>
