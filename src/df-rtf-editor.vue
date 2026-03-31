<template>
  <input-base v-bind="props" class="ck-editor-custom" :class="densityClass">
    <template #default="slotProps">
      <ck-editor-custom
        ref="$editor"
        v-model="value"
        :class="{ 'mt-6': !!label }"
        :min-height="minHeight"
        :disabled="vuetifyBindings.disabled"
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

const { densityClass, value, vuetifyBindings } = useInputBase(props, emits);
</script>

<style>
.ck-editor-custom .v-field:not(.v-field--active) .v-label.v-field-label:not(.v-field-label--floating) {
  transform: translate(0.5em, 3em);
}

.ck-editor-custom .v-input__control {
  /* So the dropdowns of ckeditor will draw over vuetify inputs that are positioned underneath */
  z-index: 1;
}

.ck {
  /* ========== BASE ========== */
  --ck-color-base-background: rgb(var(--v-theme-background));
  --ck-color-base-foreground: rgb(var(--v-theme-surface));
  --ck-color-base-border: rgb(var(--v-theme-surface-variant));

  --ck-color-text: rgb(var(--v-theme-on-surface));
  --ck-color-shadow-drop: rgba(0, 0, 0, 0.5);
  --ck-color-shadow-inner: rgba(255, 255, 255, 0.05);

  /* ========== TOOLBAR ========== */
  --ck-color-toolbar-background: rgb(var(--v-theme-surface));
  --ck-color-toolbar-border: rgb(var(--v-theme-surface-variant));

  /* ========== BUTTONS (default) ========== */
  --ck-color-button-default-background: transparent;
  --ck-color-button-default-hover-background: rgba(var(--v-theme-on-surface), 0.08);
  --ck-color-button-default-active-background: rgba(var(--v-theme-on-surface), 0.12);
  --ck-color-button-default-active-shadow: inset 0 0 0 1px rgb(var(--v-theme-primary));
  --ck-color-button-default-disabled-background: transparent;

  /* ========== BUTTONS (ON state) ========== */
  --ck-color-button-on-background: rgba(var(--v-theme-primary), 0.15);
  --ck-color-button-on-hover-background: rgba(var(--v-theme-primary), 0.25);
  --ck-color-button-on-color: rgb(var(--v-theme-primary));
  --ck-color-button-on-disabled-background: rgba(var(--v-theme-on-surface), 0.05);

  /* ========== DROPDOWN / PANELS ========== */
  --ck-color-dropdown-panel-background: rgb(var(--v-theme-surface));
  --ck-color-dropdown-panel-border: rgb(var(--v-theme-surface-variant));

  --ck-color-panel-background: rgb(var(--v-theme-surface));
  --ck-color-panel-border: rgb(var(--v-theme-surface-variant));

  /* ========== LISTS ========== */
  --ck-color-list-background: rgb(var(--v-theme-surface));
  --ck-color-list-button-hover-background: rgba(var(--v-theme-on-surface), 0.08);
  --ck-color-list-button-on-background: rgba(var(--v-theme-primary), 0.15);
  --ck-color-list-button-on-color: rgb(var(--v-theme-primary));

  /* ========== INPUTS ========== */
  --ck-color-input-background: rgb(var(--v-theme-background));
  --ck-color-input-border: rgb(var(--v-theme-surface-variant));
  --ck-color-input-text: rgb(var(--v-theme-on-surface));
  --ck-color-input-disabled-background: rgba(var(--v-theme-on-surface), 0.05);
  --ck-color-labeled-field-label-background: rgb(var(--v-theme-surface));

  /* ========== FOCUS / ACTION ========== */
  --ck-color-focus-border: rgb(var(--v-theme-primary));
  --ck-color-focus-outer-shadow: rgba(var(--v-theme-primary), 0.25);

  /* ========== LINKS ========== */
  --ck-color-link-default: rgb(var(--v-theme-info));

  /* ========== SELECTION ========== */
  --ck-color-selection-background: rgba(var(--v-theme-primary), 0.3);
  --ck-color-selection-text: rgb(var(--v-theme-on-primary));

  /* ========== DIALOGS ========== */
  --ck-color-dialog-background: rgb(var(--v-theme-surface));
  --ck-color-dialog-border: rgb(var(--v-theme-surface-variant));

  --ck-color-dialog-header-background: rgb(var(--v-theme-surface));
  --ck-color-dialog-header-border: rgb(var(--v-theme-surface-variant));

  --ck-color-dialog-footer-background: rgb(var(--v-theme-surface));
  --ck-color-dialog-footer-border: rgb(var(--v-theme-surface-variant));

  --ck-accessibility-help-dialog-code-background-color: rgb(var(--v-theme-background));

  /* ========== STYLE PANEL ========== */
  --ck-style-panel-button-label-background: rgb(var(--v-theme-surface));
  --ck-style-panel-button-hover-label-background: rgba(var(--v-theme-on-surface), 0.08);
}

/* Editable (content area) */
.ck-editor__editable {
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-surface));
}

/* Borders & separators fix */
.ck.ck-toolbar,
.ck.ck-editor__top {
  border-color: rgb(var(--v-theme-surface-variant));
}

/* Balloon panels (npr. link popup) */
.ck.ck-balloon-panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-surface-variant));
}

.ck .marker {
  background: rgb(var(--v-theme-accent), 0.6) !important;
}

/* Scrollbar */
.ck ::-webkit-scrollbar {
  width: 10px;
}

.ck ::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 6px;
}
</style>
