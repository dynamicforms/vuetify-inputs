import { Field, Group, List, ValidationError, Validators } from '@dynamicforms/vue-forms';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';

import { type VuetifyInputsSettings, vuetifyInputsSettingsKey } from './settings';
import { selectShownErrors, selectShownErrorsDeep, useShownErrors } from './shown-errors';

const required = (value: string) => new Field<string>({ value, validators: [new Validators.Required()] });

describe('selectShownErrors', () => {
  it("holds a validator's and the application's errors back until touched, and shows the server's at once", () => {
    const field = required('');
    field.errors.push(
      new ValidationError('computed', {}, 'computed here'),
      new ValidationError('taken', {}, 'taken', 'server'),
    );

    expect(selectShownErrors(field.errors, field, false, {}).map((error) => error.origin)).toEqual(['server']);
    expect(selectShownErrors(field.errors, field, true, {})).toHaveLength(3);
  });

  it('asks the shownErrors setting for every error, with the default answer, and takes its answer', () => {
    const field = required('');
    field.errors.push(new ValidationError('stale', {}, 'stale', 'sync'));
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
      value.a + value.b > 10 ? [new ValidationError('over_budget', {}, 'over budget')] : null,
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

describe('selectShownErrorsDeep', () => {
  it("shows a container's own errors, then its members' in their order, each by its own touched", () => {
    const first = required('');
    const second = required('');
    const group = new Group({ first, second });
    group.errors.push(new ValidationError('app.group', {}, 'the group', 'server'));

    expect(selectShownErrorsDeep(group, {}).map((error) => error.code)).toEqual(['app.group']);

    second.touched = true;
    expect(selectShownErrorsDeep(group, {}).map((error) => error.code)).toEqual(['app.group', 'vue-forms.required']);
    expect(selectShownErrorsDeep(group, {})[1]).toBe(second.errors[0]);
  });

  it('walks the rows of a list', () => {
    const list = new List(new Group({ name: required('') }), { value: [{ name: '' }, { name: 'set' }] });
    list.touched = true;

    expect(selectShownErrorsDeep(list, {}).map((error) => error.code)).toEqual(['vue-forms.required']);
  });

  it("shows a field's own errors", () => {
    const field = required('');
    field.touched = true;

    expect(selectShownErrorsDeep(field, {})).toEqual(field.errors);
  });
});
