
import React, { useState, useCallback, useMemo } from 'react';
import { Vocabulary, Word, WordCount } from '../types';
import { VOCABULARIES, WORD_COUNTS } from '../constants';
import { generateWords } from '../services/geminiService';
import { vocabularyData } from '../data/mockWords';

interface SetupScreenProps {
  onStart: (vocabulary: Vocabulary, words: Word[]) => void;
  isLoading: boolean;
  onLoading: (loading: boolean) => void;
  onError: (error: string) => void;
  error: string | null;
  onGoToReview: () => void;
  onGoToReader: () => void;
  onGoToReaderVocab: () => void;
  hasDifficultWords: boolean;
  hasReaderWords: boolean;
  studiedWordIds: string[];
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStart, isLoading, onLoading, onError, error, onGoToReview, onGoToReader, onGoToReaderVocab, hasDifficultWords, hasReaderWords, studiedWordIds }) => {
  const [selectedVocabulary, setSelectedVocabulary] = useState<Vocabulary>(VOCABULARIES[0]);
  const [selectedCount, setSelectedCount] = useState<WordCount>(20);

  const handleGenerate = useCallback(async () => {
    onLoading(true);
    onError('');
    try {
      const words = await generateWords(selectedVocabulary, selectedCount, studiedWordIds);
      if (words.length === 0) {
        throw new Error("No more new words to study in this category right now.");
      }
      onStart(selectedVocabulary, words);
    } catch (err) {
      if (err instanceof Error) {
        onError(err.message);
      } else {
        onError("An unknown error occurred.");
      }
    } finally {
      onLoading(false);
    }
  }, [selectedVocabulary, selectedCount, onStart, onLoading, onError, studiedWordIds]);

  const { totalWords, studiedWordsInCat } = useMemo(() => {
    const wordList = vocabularyData[selectedVocabulary] || [];
    const total = wordList.length;

    if (total === 0) {
      return { totalWords: 0, studiedWordsInCat: 0 };
    }

    const categoryWordIds = new Set(wordList.map(w => w.id));
    const studied = studiedWordIds.filter(id => categoryWordIds.has(id)).length;
    
    return { totalWords: total, studiedWordsInCat: studied };
  }, [selectedVocabulary, studiedWordIds]);

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg w-full max-w-sm mx-auto animate-fade-in">
      <div className="space-y-6">
        <div>
          <label htmlFor="vocab-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Choose Vocabulary
          </label>
          <select
            id="vocab-select"
            value={selectedVocabulary}
            onChange={(e) => setSelectedVocabulary(e.target.value as Vocabulary)}
            disabled={isLoading}
            className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
          >
            {VOCABULARIES.map((vocab) => (
              <option key={vocab} value={vocab}>
                {vocab}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="count-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Number of Words per Session
          </label>
          <select
            id="count-select"
            value={selectedCount}
            onChange={(e) => setSelectedCount(Number(e.target.value) as WordCount)}
            disabled={isLoading}
            className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
          >
            {WORD_COUNTS.map((count) => (
              <option key={count} value={count}>
                {count} Words
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        <p>本分类进度: 已学习 {studiedWordsInCat} / {totalWords} 个单词</p>
      </div>

      {error && (
        <div className="mt-4 text-center text-red-500 bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
            {error}
        </div>
      )}

      <div className="mt-8 space-y-3">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-transform transform hover:scale-105 disabled:bg-indigo-400 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Words...
            </>
          ) : (
            'Start Studying'
          )}
        </button>
        
        {hasDifficultWords && (
          <button
            onClick={onGoToReview}
            disabled={isLoading}
            className="w-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-4 focus:ring-slate-500/50 transition disabled:opacity-50"
          >
            Review Difficult Words
          </button>
        )}
        {hasReaderWords && (
            <button
            onClick={onGoToReaderVocab}
            disabled={isLoading}
            className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/50 transition disabled:opacity-50"
          >
            Reader's Vocabulary
          </button>
        )}
        <button
          onClick={onGoToReader}
          disabled={isLoading}
          className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 transition disabled:opacity-50"
        >
          Read 'Jane Eyre'
        </button>
      </div>
    </div>
  );
};

export default SetupScreen;
