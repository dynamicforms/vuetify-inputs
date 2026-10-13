import { createTranslatable, type Translatable } from '@dynamicforms/translatable';
import { getCurrentInstance, inject } from 'vue';

import { type VuetifyInputsSettings, vuetifyInputsSettingsKey } from './settings';

const defaults = {
  Yes: 'Yes',
  No: 'No',
  Close: 'Close',
  Save: 'Save',
  Cancel: 'Cancel',
  Ok: 'OK',
  Paragraph: 'Paragraph',
  Heading1: 'Heading 1',
  Heading2: 'Heading 2',
  Heading3: 'Heading 3',
  Heading4: 'Heading 4',
  Heading5: 'Heading 5',
  Heading6: 'Heading 6',
  Downloadable: 'Downloadable',
  ArticleCategory: 'Article category',
  Title: 'Title',
  Subtitle: 'Subtitle',
  InfoBox: 'Info box',
  SideQuote: 'Side quote',
  Marker: 'Marker',
  Spoiler: 'Spoiler',
  CodeDark: 'Code (dark)',
  CodeBright: 'Code (bright)',
  Undo: 'Undo',
  Redo: 'Redo',
  SelectAll: 'Select all',
  Bold: 'Bold',
  Italic: 'Italic',
  HorizontalLine: 'Horizontal line',
  Blockquote: 'Block quote',
  BulletedList: 'Bulleted list',
  NumberedList: 'Numbered list',
  Outdent: 'Decrease indent',
  Indent: 'Increase indent',
  AlignLeft: 'Align left',
  AlignCenter: 'Align center',
  AlignRight: 'Align right',
  AlignJustify: 'Justify',
  Link: 'Link',
  LinkUrl: 'URL',
  LinkApply: 'Apply',
  LinkRemove: 'Remove link',
  Image: 'Image',
  ImageUrl: 'Image URL',
  ImageUpload: 'Upload image',
  ImageInsert: 'Insert',
  ImageDropHint: 'Drop image here or click to browse',
  ImageReplace: 'Replace image',
  ImageDownload: 'Download image',
  FileDownload: 'Download file',
  Table: 'Table',
  TableInsert: 'Insert table',
  TableAddRowAbove: 'Add row above',
  TableAddRowBelow: 'Add row below',
  TableDeleteRow: 'Delete row',
  TableAddColumnBefore: 'Add column before',
  TableAddColumnAfter: 'Add column after',
  TableDeleteColumn: 'Delete column',
  TableToggleHeaderRow: 'Toggle header row',
  TableDeleteTable: 'Delete table',
  Style: 'Style',
  MediaEmbed: 'Insert media',
  MediaEmbedUrl: 'Video URL',
  MediaEmbedInsert: 'Insert',
};

type Key = keyof typeof defaults;

const global = createTranslatable(defaults);

/**
 * Sets the translation function of the library's strings for the whole process; see `@dynamicforms/translatable`.
 * An app installed with the `translate` setting translates with that one instead.
 */
export const { translateStrings } = global;

// one Translatable per settings object that states `translate`, made on first use
const perApp = new WeakMap<VuetifyInputsSettings, Translatable<typeof defaults>>();

function translatableOf(settings: VuetifyInputsSettings | undefined): Translatable<typeof defaults> {
  if (!settings?.translate) return global;
  let translatable = perApp.get(settings);
  if (!translatable) {
    translatable = createTranslatable(defaults);
    translatable.translateStrings(settings.translate, settings.translateNamespace);
    perApp.set(settings, translatable);
  }
  return translatable;
}

/**
 * The current translation of one of the library's strings. Called while a component sets up or renders, it
 * translates with the `translate` setting the component reads, as it reads every other setting, where one is given,
 * and with the function `translateStrings` set otherwise. Under server-side rendering each request's app states its
 * own `translate`. An event handler or a timer reads no setting; it uses `useTranslate()`.
 */
export function translate(key: Key, params?: Record<string, unknown>): string {
  const settings = getCurrentInstance() ? inject<VuetifyInputsSettings>(vuetifyInputsSettingsKey, {}) : undefined;
  return translatableOf(settings).translate(key, params);
}

/**
 * `translate` bound to the settings the calling component reads, for use outside its setup and render: in an event
 * handler or a timer. Called in a component's setup.
 */
export function useTranslate(): (key: Key, params?: Record<string, unknown>) => string {
  const translatable = translatableOf(inject<VuetifyInputsSettings>(vuetifyInputsSettingsKey, {}));
  return (key, params) => translatable.translate(key, params);
}
