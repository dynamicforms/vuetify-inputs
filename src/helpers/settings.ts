import { FieldDensity, type FieldVariant } from '@/helpers/input-base';

export interface VuetifyInputsSettings {
  defaultVariant?: FieldVariant;
  defaultDensity?: FieldDensity;
  /** Milliseconds between `<df-file>`/`<df-image>` keep-alive touches; overridable per field by their
   *  `touchInterval` prop. Defaults to 60000 when neither is set. */
  defaultTouchInterval?: number;
}

export const vuetifyInputsSettingsKey = Symbol('vuetifyInputsSettingsKey');
