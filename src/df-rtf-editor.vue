<template>
  <input-base v-bind="props" class="rtf-editor" :class="densityClass">
    <template #default="slotProps">
      <rtf-editor-core
        ref="$editor"
        v-model="value"
        :class="{ 'mt-6': !!label }"
        :min-height="minHeight"
        :disabled="vuetifyBindings.disabled"
        :toolbar-button-size="toolbarButtonSize"
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
import RtfEditorCore from './helpers/rtf-editor/editor-core.vue';

const props = withDefaults(defineProps<DfRtfEditorProps>(), { ...defaultBaseProps, minHeight: undefined });

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const { densityClass, value, vuetifyBindings } = useInputBase(props, emits);
</script>

<style>
.rtf-editor .v-field:not(.v-field--active) .v-label.v-field-label:not(.v-field-label--floating) {
  /* `--rtf-toolbar-height` is set by editor-core.vue's own `ResizeObserver`, straight onto this `.v-field`; the
     3em fallback only matters before that first measurement lands or if it never does (a non-browser render).
     The added 0.5em is the gap between the toolbar's bottom edge and the label's own baseline - without it the
     label sits flush against the toolbar instead of inside the content area's padding. */
  transform: translate(0.5em, calc(var(--rtf-toolbar-height, 3em) + 1em));
}

.rtf-editor .v-input__control {
  /* So the toolbar's dropdown menus draw over vuetify inputs that are positioned underneath */
  z-index: 1;
}
</style>
