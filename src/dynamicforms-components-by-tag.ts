import {
  DfActions,
  DfCheckbox,
  DfColor,
  DfDateTime,
  DfFile,
  DfInput,
  DfInputHint,
  DfLabel,
  DfRtfEditor,
  DfSelect,
  DfTextArea,
} from './dynamicforms-components';

/**
 * Every component this library draws with, keyed by the tag a layout names it by.
 *
 * A rendering layer that resolves a component by name out of a map - `@dynamicforms/vuetify-modal-form-kit`'s
 * `<component-render>` is one - is handed this instead of keeping a list of its own, which would have to be
 * extended whenever this package gains a component and would silently render nothing until it was.
 *
 * The keys are the kebab-case of the export names, so a tag names the same component whether it is looked up
 * here or left to Vue's own resolver after `DynamicFormsInputs` has registered the components globally.
 */
export const dfInputComponentsByTag = {
  'df-actions': DfActions,
  'df-checkbox': DfCheckbox,
  'df-color': DfColor,
  'df-date-time': DfDateTime,
  'df-file': DfFile,
  'df-input': DfInput,
  'df-input-hint': DfInputHint,
  'df-label': DfLabel,
  'df-rtf-editor': DfRtfEditor,
  'df-select': DfSelect,
  'df-text-area': DfTextArea,
} as const;

/** The tags {@link dfInputComponentsByTag} answers for. */
export type DfInputComponentTag = keyof typeof dfInputComponentsByTag;
