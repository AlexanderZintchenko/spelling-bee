export type Dictionary = {
  name: string;
  noLazyMode: boolean;
  orderedByFrequency: boolean;
  comment?: string;
  _comment?: string;
  bcp47: string;
  additionalAccents: string[][];
  words: string[];
};