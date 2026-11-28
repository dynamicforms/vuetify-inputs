<template>
  <input-base v-bind="props" class="rtf-editor" :class="densityClass" @click="focusFromLabel" @click:clear="value = ''">
    <template #default="slotProps">
      <rtf-editor-core
        ref="editorRef"
        v-model="value"
        :class="{ 'mt-6': !!label }"
        :min-height="minHeight"
        :readonly="vuetifyBindings.readonly"
        :toolbar-button-size="toolbarButtonSize"
        :font-family="fontFamily"
        :content-attributes="{ id: slotProps.props.id, ...controlAria(slotProps.props) }"
        v-bind="passthroughAttrs"
        @focusin="slotProps.focus()"
        @focusout="slotProps.blur()"
      />
    </template>
  </input-base>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { DfRtfEditorProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, InputBase, useInputBase } from './helpers';
import { controlAria } from './helpers/control-aria';
import RtfEditorCore from './helpers/rtf-editor/editor-core.vue';

const props = withDefaults(defineProps<DfRtfEditorProps>(), { ...defaultBaseProps, minHeight: undefined });

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const { densityClass, value, vuetifyBindings } = useInputBase(props, emits);

// the editable element is not labelable, so a click on the field label does not reach it on its own
const editorRef = ref<InstanceType<typeof RtfEditorCore> | null>(null);
function focusFromLabel(event: MouseEvent) {
  if ((event.target as Element | null)?.closest?.('.v-field-label')) editorRef.value?.focus();
}
</script>

<style>
.rtf-editor .v-field:not(.v-field--active) .v-label.v-field-label:not(.v-field-label--floating) {
  /* below the toolbar: its height (3em until measured) plus 1em */
  transform: translate(0.5em, calc(var(--rtf-toolbar-height, 3em) + 1em));
}

.rtf-editor .v-input__control {
  /* So the toolbar's dropdown menus draw over vuetify inputs that are positioned underneath */
  z-index: 1;
}
</style>
