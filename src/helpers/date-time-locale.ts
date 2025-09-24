import { Locale } from 'date-fns';
import { sl } from 'date-fns/locale/sl'; // eslint-disable-line import/extensions
import { isRef, ref, Ref } from 'vue';

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
