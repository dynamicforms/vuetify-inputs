/**
 * The namespace of the error codes this library declares. A code the library raises is `${ERROR_NAMESPACE}.<code>`,
 * such as `vuetify-inputs.invalid_date`.
 */
export const ERROR_NAMESPACE = 'vuetify-inputs';

/** The full code of `code`, an error code this library declares. */
export function namespaced(code: string): string {
  return `${ERROR_NAMESPACE}.${code}`;
}
