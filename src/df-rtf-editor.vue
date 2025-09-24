<template>
  <input-base v-bind="props" class="ck-editor-custom">
    <template #default="slotProps">
      <ck-editor-custom
        ref="$editor"
        v-model="value"
        :class="{ 'mt-6': !!label }"
        :min-height="minHeight"
        :disabled="vuetifyBindings.disabled"
        placeholder="dfsjghdf"
        v-bind="passthroughAttrs"
        @focusin="slotProps.focus()"
        @focusout="slotProps.blur()"
      />
    </template>
  </input-base>
</template>

<script setup lang="ts">
import { DfRtfEditorProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, InputBase, useInputBase } from './helpers';
import CkEditorCustom from './helpers/ck-editor-custom.vue';

const props = withDefaults(defineProps<DfRtfEditorProps>(), { ...defaultBaseProps, minHeight: undefined });

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const { value, vuetifyBindings } = useInputBase(props, emits);
</script>

<style>
.ck-editor-custom .v-field:not(.v-field--active) .v-label.v-field-label:not(.v-field-label--floating) {
  transform: translate(0.5em, 3em);
}
</style>
