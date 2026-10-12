import { formatParams, interpolate } from "@dynamicforms/translatable";
import { ref } from "vue";

import { type ErrorText, MdString } from "../../src";

import messages from "./demo-error-messages.json";

type Language = keyof typeof messages;

export const languages: { value: Language; title: string }[] = [
  { value: "en", title: "🇬🇧 English" },
  { value: "sl", title: "🇸🇮 Slovenščina" },
  { value: "de", title: "🇩🇪 Deutsch" },
  { value: "es", title: "🇪🇸 Español" },
  { value: "ja", title: "🇯🇵 日本語" },
  { value: "zh", title: "🇨🇳 中文" },
  { value: "fa", title: "🇮🇷 فارسی" },
  { value: "bn", title: "🇧🇩 বাংলা" },
];

// the language and the markdown setting every demo's errors are rendered in
export const errorLanguage = ref<Language>("en");
export const markdownErrors = ref(true);

// the message for a key in the current language with the params substituted, or the key where there is none
const t = (key: string, params: Record<string, unknown>) => {
  const template = (
    messages[errorLanguage.value].errors as Record<string, string>
  )[key];
  return template === undefined ? key : interpolate(template, params);
};

// numbers in the language's digits
const tf = formatParams(t, (value) =>
  typeof value === "number"
    ? new Intl.NumberFormat(errorLanguage.value).format(value)
    : value,
);

// a role is stored as its code and shown by its name in the current language
export const roleName = (role: string) =>
  (messages[errorLanguage.value].roles as Record<string, string>)[role] ?? role;

/**
 * The docs' errorText setting: the `Md` variant of the code's message as markdown while `markdownErrors` is set, the
 * plain message otherwise, and the error's detail for a code without a message.
 */
export const errorText: ErrorText = (error) => {
  const params =
    error.code === "in_allowed_values"
      ? {
          allowedAsText: (error.params.allowedValues as string[])
            .map(roleName)
            .join(", "),
        }
      : error.params;
  if (markdownErrors.value) {
    const markdown = tf(`${error.code}Md`, params);
    if (markdown !== `${error.code}Md`) return new MdString(markdown);
  }
  const text = tf(error.code, params);
  return text === error.code ? undefined : text;
};
