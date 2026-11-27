import { isArray, first, castArray } from 'lodash-es';
import MarkdownIt from 'markdown-it';
import { Ref } from 'vue';

import { SelectChoice } from './df-select.interface';
import {
  HtmlString,
  isCallableFunction,
  MdString,
  isRenderContent,
  type RenderContentNonCallable,
  type RenderContentRef,
  renderContentText,
} from './render-content';

/** The content of a choice's text: content as given, a function's answer, `''` for none, any other value as
 * `String(value)`. */
export function choiceContent(text: unknown): RenderContentNonCallable {
  const content = isCallableFunction(text as RenderContentRef) ? (text as () => unknown)() : text;
  if (isRenderContent(content)) return content;
  return content == null ? '' : String(content);
}

// the text of each MdString rendered so far
const markdownTexts = new WeakMap<MdString, string>();

// the text of markdown as rendered with its options and plugins
function markdownText(md: MdString): string {
  let text = markdownTexts.get(md);
  if (text === undefined) {
    const renderer = new MarkdownIt(md.options ?? {});
    (md.plugins ?? []).forEach((plugin) => renderer.use(plugin));
    text = renderContentText(new HtmlString(renderer.render(md.toString())));
    markdownTexts.set(md, text);
  }
  return text;
}

/** The plain text of a choice's text: `renderContentText` of its content, an `MdString` rendered first. */
export function choiceText(text: unknown): string {
  const content = choiceContent(text);
  return content instanceof MdString ? markdownText(content) : renderContentText(content);
}

/** The items for Vuetify: `title` is the plain text, `content` the choice's text as given. */
export function convertItems(items: SelectChoice[]) {
  return items.map((item) => ({ value: item.id, title: choiceText(item.text), content: item.text, icon: item.icon }));
}

/**
 * multipleCompliantValue ensures that resulting value of the select component is
 * 1 - null, when the value is null or undefined
 * 2 - array, when multiple is truthy; an empty array stays an empty array
 * 3 - ordinal / simple value when multiple is not truthy, null for an empty array
 * @param value the value to make compliant
 * @param multiple indicator for multiple selection
 */
export function multipleCompliantValue(value: any, multiple: boolean): any {
  if (value == null) return null;
  if (isArray(value) && value.length === 0) return multiple ? [] : null;
  if (multiple) return castArray(value);
  return isArray(value) ? (first(value) ?? null) : value;
}

export function getSelectedChoices(loadedChoices: SelectChoice[], multipleCpliantValue: any | any[] | null) {
  if (multipleCpliantValue == null) return [];
  const mcValue = castArray(multipleCpliantValue);
  return loadedChoices.filter((choice) => mcValue.some((val: any) => val === choice.id));
}

/**
 * updateSelectedFromValue ensures that the actual select component receives model-value formatted to its needs. It
 * only sets what the select shows: the value itself is not written.
 */
export function updateSelectedFromValue(
  resultingValue: any,
  selected: Ref<any>,
  multiple: boolean,
  taggable: boolean,
  choices: SelectChoice[],
) {
  const mcValue = multipleCompliantValue(resultingValue, multiple);

  if (mcValue == null) {
    selected.value = multiple ? [] : null;
    return;
  }

  if (multiple) {
    if (taggable) {
      // if taggable (can add new items not in choices), keep the value as-is
      selected.value = mcValue;
    } else {
      // when not taggable, we filter the result to the given choices
      selected.value = getSelectedChoices(choices, mcValue).map((choice) => choice.id);
    }
  } else {
    if (taggable) {
      // if taggable, we just keep the selected value
      selected.value = mcValue;
    } else {
      // when not taggable, we filter the result to the given choices
      const matchingChoice = first(getSelectedChoices(choices, mcValue));
      selected.value = matchingChoice?.id ?? null;
    }
  }
}
