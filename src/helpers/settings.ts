import { FieldDensity, type FieldVariant } from '@/helpers/input-base';

export interface VuetifyInputsSettings {
  defaultVariant?: FieldVariant;
  defaultDensity?: FieldDensity;
}

export const vuetifyInputsSettingsKey = Symbol('vuetifyInputsSettingsKey');
