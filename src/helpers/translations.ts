export const translatableStrings = {
  Yes: 'Yes',
  No: 'No',
  Close: 'Close',
};

export function translateStrings(translationCallback: (s: string) => string) {
  Object.keys(translatableStrings).forEach((key) => {
    translatableStrings[key as keyof typeof translatableStrings] = translationCallback(key);
  });
}
