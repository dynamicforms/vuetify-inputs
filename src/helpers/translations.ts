export const translatableStrings = {
  Yes: 'Yes',
  No: 'No',
  Close: 'Close',
  Paragraph: 'Paragraph',
  Heading1: 'Heading 1',
  Heading2: 'Heading 2',
  Heading3: 'Heading 3',
  Heading4: 'Heading 4',
  Heading5: 'Heading 5',
  Heading6: 'Heading 6',
  Downloadable: 'Downloadable',
  ArticleCategory: 'Article category',
  Title: 'Title',
  Subtitle: 'Subtitle',
  InfoBox: 'Info box',
  SideQuote: 'Side quote',
  Marker: 'Marker',
  Spoiler: 'Spoiler',
  CodeDark: 'Code (dark)',
  CodeBright: 'Code (bright)',
};

export function translateStrings(translationCallback: (s: string) => string) {
  Object.keys(translatableStrings).forEach((key) => {
    const translation = translationCallback(key);
    if (translation != null) {
      translatableStrings[key as keyof typeof translatableStrings] = translation;
    }
  });
}

export function setCkEditorLanguage(language: string, translations: any) {
  ckEditorLanguage.language = language;
  ckEditorLanguage.translations = translations;
}

export const ckEditorLanguage = {
  language: 'en',
  translations: undefined,
};
