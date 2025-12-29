
export enum Vocabulary {
  CET4 = "CET-4",
  CET6 = "CET-6",
}

export type WordCount = 10 | 20 | 30;

export interface Word {
  id: string;
  word: string;
  pronunciation: string;
  translation: string;
}

export interface DifficultWordEntry {
  word: Word;
  knownCount: number;
}