import { CkeditorPlugin } from '@ckeditor/ckeditor5-vue';
import { App } from 'vue';

export * from './helpers';
export { default as DfActions } from './df-actions.vue';
export { default as DfCheckbox } from './df-checkbox.vue';
export { default as DfColor } from './df-color.vue';
export { default as DfDateTime } from './df-datetime.vue';
export { default as DfFile } from './df-file.vue';
export { default as DfInput } from './df-input.vue';
export { default as DfRtfEditor } from './df-rtf-editor.vue';
export { default as DfSelect } from './df-select.vue';
export { default as DfTextArea } from './df-text-area.vue';

export const VuetifyInputs = {
  install: (app: App) => {
    app.use(CkeditorPlugin);
  },
};
