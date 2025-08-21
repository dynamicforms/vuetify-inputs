import { Locale } from 'date-fns';
import { sl } from 'date-fns/locale';
import { isRef, ref, Ref } from 'vue';

// eslint-disable-next-line import/prefer-default-export
export const DateTimeLocaleConfig = {
  dateTimeLocale: ref(sl),
  setDateTimeLocale(locale: Locale | Ref<Locale>) {
    if (isRef(locale)) {
      this.dateTimeLocale = locale;
    } else {
      this.dateTimeLocale.value = locale;
    }
  },
};
