import { isArray, first, castArray } from 'lodash-es';
import { Ref } from 'vue';

import { SelectChoice } from './df-select.interface';

export function convertItems(items: SelectChoice[]) {
  return items.map((item) => ({ value: item.id, title: item.text, icon: item.icon }));
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
  // Če je vrednost null ali undefined
  if (value == null) return null;

  // Prazno polje: pri multiple ostane prazno polje, pri single ni izbire
  if (isArray(value) && value.length === 0) return multiple ? [] : null;

  // Za multiple vedno vrni polje
  if (multiple) return castArray(value);

  // Za single vrni prvo vrednost ali vrednost samo
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
