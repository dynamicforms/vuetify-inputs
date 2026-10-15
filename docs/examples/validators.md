# Validation and i18n

The validators of `@dynamicforms/vue-forms` on this library's components.

## Demo

A form using various validators. The errors are rendered by the docs' [`errorText` setting](/examples/localisation#translating-errors):
translated into eight languages and, with the checkbox on, as markdown. Changing either setting re-renders the errors
already on the fields without revalidating.

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
  and invalid; `new Validators.Required({ trim: false })` measures the string untrimmed. Only strings are
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
- **Error display**: the shown errors of each field, rendered by `errorText`

## Try It Yourself

In the demo:

1. Leave the username empty, or enter only spaces
2. Enter an invalid email address
3. Set the age outside the valid range
4. Select different roles
5. Enter a bio that is too short or too long
6. Switch the language or the markdown setting while errors are shown

<script setup>
import ValidatorsFormDemo from '../components/validators-demo.vue';
</script>
