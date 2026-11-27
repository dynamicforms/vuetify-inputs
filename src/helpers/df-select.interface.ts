export interface SelectChoice {
  id: any;
  /** `RenderContent`, or a function answering it, so that it can follow the locale. Any other value is shown as
   * `String(value)`. */
  text: any;
  icon?: string;
}

export type SelectFetchChoices<T1 = any, T2 = any> = (queryValue?: T1, idValue?: T2) => Promise<SelectChoice[]>;
