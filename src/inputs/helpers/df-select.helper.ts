import { isArray, first, castArray } from 'lodash-es';
import { Ref } from 'vue';

import { SelectChoice } from './df-select.interface';

export function convertItems(items: SelectChoice[]) {
  return items.map((item) => ({ value: item.id, title: item.text, icon: item.icon }));
}

/**
 * multipleCompliantValue ensures that resulting value of the select component is
 * 1 - null, when nothing is selected
 * 2 - array, when multiple is truthy
 * 3 - ordinal / simple value when multiple is not truthy
 * @param value the value to make compliant
 * @param multiple indicator for multiple selection
 */
export function multipleCompliantValue(value: any, multiple: boolean): any {
  // Če je vrednost null ali undefined
  if (value == null) return null;

  // Če je prazno polje (za multiple)
  if (isArray(value) && value.length === 0) return null;

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
 * updateSelectedFromValue ensures that the actual select component receives model-value formatted to its needs
 */
export function updateSelectedFromValue(
  resultingValue: any,
  selected: Ref<any>,
  multiple: boolean,
  taggable: boolean,
  loadedChoices: SelectChoice[],
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
      // when not taggable, we filter the result to existing choices
      selected.value = getSelectedChoices(loadedChoices, mcValue).map((choice) => choice.id);
    }
  } else {
    // eslint-disable-next-line no-lonely-if
    if (taggable) {
      // if taggable, we just keep the selected value
      selected.value = mcValue;
    } else {
      // when not taggable, we filter the result to existing choices
      const matchingChoice = first(getSelectedChoices(loadedChoices, mcValue));
      selected.value = matchingChoice?.id ?? null;
    }
  }
}
