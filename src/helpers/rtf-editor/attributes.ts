/** Tiptap attribute definition that mirrors the HTML attribute `name`; omitted from the output when empty. */
export function htmlAttribute(name: string) {
  return {
    default: null,
    parseHTML: (element: HTMLElement) => element.getAttribute(name),
    renderHTML: (attributes: Record<string, any>) => (attributes[name] ? { [name]: attributes[name] } : {}),
  };
}
