export interface SelectChoice {
  id: any;
  text: any;
  icon?: string;
}

export type SelectFetchChoices<T1 = any, T2 = any> = (queryValue?: T1, idValue?: T2) => Promise<SelectChoice[]>;
