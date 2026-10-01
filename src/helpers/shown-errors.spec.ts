import { Field, Group, ValidationErrorText, Validators } from '@dynamicforms/vue-forms';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';

import { type VuetifyInputsSettings, vuetifyInputsSettingsKey } from './settings';
import { selectShownErrors, useShownErrors } from './shown-errors';

const required = (value: string) => new Field<string>({ value, validators: [new Validators.Required()] });

describe('selectShownErrors', () => {
  it("holds a validator's and the application's errors back until touched, and shows the server's at once", () => {
    const field = required('');
    field.errors.push(
      new ValidationErrorText('computed here'),
      new ValidationErrorText('taken', '', 'taken', 'server'),
    );

    expect(selectShownErrors(field.errors, field, false, {}).map((error) => error.origin)).toEqual(['server']);
    expect(selectShownErrors(field.errors, field, true, {})).toHaveLength(3);
  });

  it('asks the shownErrors setting for every error, with the default answer, and takes its answer', () => {
    const field = required('');
    field.errors.push(new ValidationErrorText('stale', '', 'stale', 'sync'));
    const asked: [string, boolean][] = [];
    const settings: VuetifyInputsSettings = {
      shownErrors: (error, control, shownByDefault) => {
        asked.push([error.origin, shownByDefault]);
        return error.origin === 'sync' || shownByDefault;
      },
    };

    expect(selectShownErrors(field.errors, field, false, settings).map((error) => error.origin)).toEqual(['sync']);
    expect(asked).toEqual([
      ['validator', false],
      ['sync', false],
    ]);
  });
});

describe('useShownErrors', () => {
  const render = (element: Group, settings: VuetifyInputsSettings = {}) => {
    let shown: ReturnType<typeof useShownErrors> | undefined;
    mount(
      defineComponent({
        setup() {
          shown = useShownErrors(() => element);
          return () => h('div');
        },
      }),
      { global: { provide: { [vuetifyInputsSettingsKey]: settings } } },
    );
    return shown!;
  };

  it("shows a group's own errors once any member is touched", () => {
    const budget = new Validators.Validator((value: any) =>
      value.a + value.b > 10 ? [new ValidationErrorText('over budget')] : null,
    );
    const form = new Group({ a: new Field({ value: 8 }), b: new Field({ value: 8 }) }, { validators: [budget] });
    const shown = render(form);

    expect(shown.value).toEqual([]);
    form.fields.a.touched = true;
    expect(shown.value).toHaveLength(1);
  });

  it('takes the condition the application provided', () => {
    const form = new Group({ a: required('') }, { validators: [new Validators.Required()] });
    form.fields.a.access = 'disabled';
    const shown = render(form, { shownErrors: () => true });

    expect(form.valid).toBe(false);
    expect(shown.value).toHaveLength(1);
  });
});
