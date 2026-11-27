import { isArray, first, castArray } from 'lodash-es';
import { Ref } from 'vue';

import { SelectChoice } from './df-select.interface';
import { renderMarkdown } from './markdown';
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

/** The plain text of a choice's text: `renderContentText` of its content, an `MdString` rendered first. */
export function choiceText(text: unknown): string {
  const content = choiceContent(text);
  return renderContentText(content instanceof MdString ? new HtmlString(renderMarkdown(content)) : content);
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

/** The ids of a multiple-compliant value that none of the choices has as its id. */
export function uncoveredIds(choices: SelectChoice[], multipleCompliantVal: any): any[] {
  if (multipleCompliantVal == null) return [];
  return castArray(multipleCompliantVal).filter((val) => !choices.some((choice) => choice.id === val));
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

  // a taggable select keeps any value; otherwise the value is reduced to the given choices
  if (taggable) {
    selected.value = mcValue;
    return;
  }

  if (multiple) {
    selected.value = getSelectedChoices(choices, mcValue).map((choice) => choice.id);
  } else {
    selected.value = first(getSelectedChoices(choices, mcValue))?.id ?? null;
  }
}
