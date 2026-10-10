# Validators Example

This example demonstrates how to use the validators of `@dynamicforms/vue-forms` with this library's components.

## Demo

A form using various validators. The errors are rendered by the docs' [`errorText` setting](/examples/localisation#translating-errors):
translated into eight languages and, with the checkbox on, as markdown. The errors already on the fields follow
either choice without revalidating.

<ValidatorsFormDemo />

## Source Code

### The form

<<< @/components/validators-demo.vue

### The errorText setting

The docs install the plugin with `app.use(DynamicFormsInputs, { errorText })`, with `errorText` from this module:

<<< @/components/demo-error-text.ts

The messages, in `demo-error-messages.json`, hold each code's message and, for some codes, a markdown variant under
the code with `Md` appended:

```json
{
  "sl": {
    "errors": {
      "required": "Prosimo, vnesite vrednost",
      "value_in_range": "Vrednost mora biti med {minValue} in {maxValue}",
      "value_in_rangeMd": "Vrednost mora biti med **{minValue}** in **{maxValue}**",
      "invalid_email": "Vnesite veljaven e-poštni naslov",
      "invalid_emailMd": "Vnesite veljaven **e-poštni naslov**"
    },
    "roles": { "admin": "Skrbnik", "user": "Uporabnik", "guest": "Gost" }
  }
}
```

## Errors in This Demo

Every error has a `code`, `params` and an English `detail`. The validators built without options carry the
validator's own code (`required`, `value_in_range`, …); the email pattern is given `{ code: 'invalid_email', detail }`.

- **Messages.** `errorText` looks the code up in the current language and substitutes the params with `interpolate`
  from `@dynamicforms/translatable`. A code the language has no message for renders as the error's `detail`.
- **Markdown.** With the checkbox on, `errorText` returns the code's `Md` variant as an `MdString`. A code without
  one, such as `required`, renders as plain text.
- **Numbers.** `formatParams` formats the params before they are substituted, so Persian and Bengali show the age
  range in their own digits.
- **Role names.** A role is stored as its code. The error's params carry the codes in `allowedValues`, and
  `errorText` names them in the current language, as the select's items do.
- **Right to left.** Persian is written right to left; the demo wraps itself in Vuetify's `v-locale-provider` with
  `rtl` set for it.

## Key Features Demonstrated

- **Required Validator**: Fails on an empty value - a zero-length string, an empty array, an empty plain object,
  `null` or `undefined`. A string is measured after it is trimmed, so a field holding nothing but spaces is empty
  and invalid; `new Validators.Required({ trim: false })` measures the string as it stands. Only strings are
  trimmed - an array, an object or any other value is measured as it is
- **Pattern Validator**: Tests `String(value)` against a regular expression (email format here)
- **ValueInRange Validator**: Fails when the value is below the minimum or above the maximum, or cannot be compared
  with the bounds. Numbers compare with numbers, strings with strings and dates with dates
- **InAllowedValues Validator**: Restricts input to a predefined set of values, read at each validation rather than
  at construction
- **LengthInRange Validator**: Validates that the length of the value is within the given bounds; strings, arrays
  and plain objects are measured by their own length, anything else by the length of `String(value)`
- **Empty values**: every validator except `Required` passes `null`, `undefined`, `''`, `[]` and `{}`, so each
  field that must be filled also carries `Required`
- **Form-level Validation**: `group.valid` covers the group's own errors and those of every field it holds
- **Error Display**: Showing validation errors to the user

## Try It Yourself

Experiment with the validators by:
1. Leaving the username empty, or typing nothing but spaces into it
2. Entering an invalid email address
3. Setting age outside the valid range
4. Selecting different role values
5. Entering text that's too short or too long in the bio field
6. Switching the language or the markdown setting while errors are showing

<script setup>
import ValidatorsFormDemo from '../components/validators-demo.vue';
</script>
