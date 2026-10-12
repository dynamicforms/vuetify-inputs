import { computed, ref } from 'vue';

import { translate, translateStrings } from './translations';

describe('translations', () => {
  afterEach(() => {
    translateStrings((key) => key);
  });

  it('should answer the English defaults before translateStrings is called', () => {
    expect(translate('Yes')).toBe('Yes');
    expect(translate('Bold')).toBe('Bold');
  });

  it('should answer the translation function, with the key under the namespace', () => {
    const catalogue: Record<string, string> = { 'df_inputs.Bold': 'Krepko' };
    translateStrings((key) => catalogue[key] ?? key, 'df_inputs');

    expect(translate('Bold')).toBe('Krepko');
    expect(translate('Italic')).toBe('Italic');
  });

  it('should update a computed over translate when the state the translation function reads changes', () => {
    const locale = ref('en');
    translateStrings((key) => (locale.value === 'sl' && key === 'Bold' ? 'Krepko' : key));
    const bold = computed(() => translate('Bold'));
    expect(bold.value).toBe('Bold');

    locale.value = 'sl';

    expect(bold.value).toBe('Krepko');
  });
});
