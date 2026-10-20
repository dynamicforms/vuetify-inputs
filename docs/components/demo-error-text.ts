import { formatParams, interpolate } from '@dynamicforms/translatable';
import { ERROR_NAMESPACE as VUE_FORMS_ERRORS } from '@dynamicforms/vue-forms';
import { ref } from 'vue';

import { ERROR_NAMESPACE as VUETIFY_INPUTS_ERRORS, type ErrorText, MdString } from '../../src';

import messages from './demo-error-messages.json';

type Language = keyof typeof messages;

export const languages: { id: Language; text: string }[] = [
  { id: 'en', text: '🇬🇧 English' },
  { id: 'sl', text: '🇸🇮 Slovenščina' },
  { id: 'de', text: '🇩🇪 Deutsch' },
  { id: 'es', text: '🇪🇸 Español' },
  { id: 'ja', text: '🇯🇵 日本語' },
  { id: 'zh', text: '🇨🇳 中文' },
  { id: 'fa', text: '🇮🇷 فارسی' },
  { id: 'bn', text: '🇧🇩 বাংলা' },
];

// the language and the markdown setting every demo's errors are rendered in
export const errorLanguage = ref<Language>('en');
export const markdownErrors = ref(true);

// the block of `errors` that holds the messages of each error namespace: vue-forms', this library's and the docs' own
const messageBlocks: Record<string, string> = {
  [VUE_FORMS_ERRORS]: 'vue-forms',
  [VUETIFY_INPUTS_ERRORS]: 'vuetify-inputs',
  app: 'app',
};

// the key of a full error code: its block and its code, split at the code's last `.`; undefined for a namespace
// without a block
const errorKey = (fullCode: string) => {
  const dot = fullCode.lastIndexOf('.');
  const block = messageBlocks[fullCode.slice(0, dot)];
  return block === undefined ? undefined : `${block}.${fullCode.slice(dot + 1)}`;
};

// the message for a key (`<block>.<code>`) in the current language with the params substituted, or the key where
// there is none
const t = (key: string, params: Record<string, unknown>) => {
  const dot = key.indexOf('.');
  const blocks = messages[errorLanguage.value].errors as Record<string, Record<string, string>>;
  const template = blocks[key.slice(0, dot)]?.[key.slice(dot + 1)];
  return template === undefined ? key : interpolate(template, params);
};

// numbers in the language's digits
const tf = formatParams(t, (value) =>
  typeof value === 'number' ? new Intl.NumberFormat(errorLanguage.value).format(value) : value,
);

// a role is stored as its code and shown by its name in the current language
export const roleName = (role: string) => (messages[errorLanguage.value].roles as Record<string, string>)[role] ?? role;

/**
 * The docs' errorText setting: the `Md` variant of the code's message as markdown while `markdownErrors` is set, the
 * plain message otherwise, and the error's detail for a code without a message.
 */
export const errorText: ErrorText = (error) => {
  const key = errorKey(error.code);
  if (key === undefined) return undefined;
  const params =
    error.code === `${VUE_FORMS_ERRORS}.in_allowed_values`
      ? {
          allowedAsText: (error.params.allowedValues as string[]).map(roleName).join(', '),
        }
      : error.params;
  if (markdownErrors.value) {
    const markdown = tf(`${key}Md`, params);
    if (markdown !== `${key}Md`) return new MdString(markdown);
  }
  const text = tf(key, params);
  return text === key ? undefined : text;
};
