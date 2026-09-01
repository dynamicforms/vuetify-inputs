import { computed } from 'vue';

import { translatableStrings, translateStrings } from './translations';

describe('translations', () => {
  afterEach(() => {
    translateStrings(() => undefined);
  });

  it('should start out equal to the English defaults', () => {
    expect(translatableStrings.Yes).toBe('Yes');
    expect(translatableStrings.Bold).toBe('Bold');
  });

  it('should replace an entry with what the callback returns for it', () => {
    const translations: Partial<Record<keyof typeof translatableStrings, string>> = { Bold: 'Krepko' };
    translateStrings((key) => translations[key]);

    expect(translatableStrings.Bold).toBe('Krepko');
  });

  it('should update a computed built over the table when translateStrings replaces an entry', () => {
    const bold = computed(() => translatableStrings.Bold);
    const translations: Partial<Record<keyof typeof translatableStrings, string>> = { Bold: 'Krepko' };

    translateStrings((key) => translations[key]);

    expect(bold.value).toBe('Krepko');
  });

  it('should reset a key to its English default on a later call that no longer covers it', () => {
    const translations: Partial<Record<keyof typeof translatableStrings, string>> = { Bold: 'Krepko' };
    translateStrings((key) => translations[key]);
    expect(translatableStrings.Bold).toBe('Krepko');

    translateStrings(() => undefined);
    expect(translatableStrings.Bold).toBe('Bold');
  });
});
