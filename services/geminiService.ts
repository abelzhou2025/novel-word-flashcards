
import { Vocabulary, Word, WordCount } from "../types";
import { vocabularyData } from '../data/mockWords';

export async function generateWords(
  vocabulary: Vocabulary, 
  count: WordCount, 
  studiedIds: string[] = []
): Promise<Word[]> {
  // Simulate a small delay to make the loading spinner visible and the transition smoother.
  await new Promise(resolve => setTimeout(resolve, 300)); 
  
  const wordList = vocabularyData[vocabulary];
  
  if (!wordList || wordList.length === 0) {
    // This provides a fallback and a clear error message if a word list is missing.
    throw new Error(`Sorry, no words are available for the "${vocabulary}" level yet.`);
  }

  const result: Word[] = [];
  const selectedIds = new Set<string>();
  const allWordsById = new Map(wordList.map(w => [w.id, w]));
  const studiedIdSet = new Set(studiedIds);

  // --- Step 1: Prioritize completely unseen words ---
  const unseenWords = wordList.filter(w => !studiedIdSet.has(w.id));
  
  // Shuffle unseen words to add variety for the first-pass selection
  unseenWords.sort(() => Math.random() - 0.5);

  for (const word of unseenWords) {
    if (result.length < count) {
      result.push(word);
      selectedIds.add(word.id);
    }
  }

  // --- Step 2: If more words are needed, use studied words, starting from the least recent ---
  if (result.length < count) {
    // The `studiedIds` array is ordered from most recent to least recent.
    // By reversing it, we get a list from least recent to most recent, which is what we want.
    const leastRecentStudiedIds = [...studiedIds].reverse();
    
    for (const id of leastRecentStudiedIds) {
      if (result.length < count && !selectedIds.has(id)) {
        const word = allWordsById.get(id);
        if (word) {
          result.push(word);
          selectedIds.add(id);
        }
      }
    }
  }
  
  // --- Step 3: Final shuffle ---
  // This mixes any unseen and seen words so the session doesn't feel predictable
  // (e.g. all new words first, then all old words).
  result.sort(() => Math.random() - 0.5);

  // In the very rare case the pool is smaller than the requested count,
  // this will just return all available words.
  return result;
}