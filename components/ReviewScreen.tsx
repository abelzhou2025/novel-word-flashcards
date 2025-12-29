
import React from 'react';
import { DifficultWordEntry } from '../types';
import ReviewListItem from './ReviewListItem';

interface ReviewScreenProps {
  difficultWords: Map<string, DifficultWordEntry>;
  onBack: () => void;
  onDeleteWord: (wordId: string) => void;
  onStartLoopingTest: () => void;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ difficultWords, onBack, onDeleteWord, onStartLoopingTest }) => {
  const wordsArray = Array.from(difficultWords.values());

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg w-full max-w-sm mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Difficult Words</h2>
        <button onClick={onBack} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          &larr; Back to Home
        </button>
      </div>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">Swipe right on a word to delete it from this list.</p>

      {wordsArray.length > 0 ? (
        <>
          <div className="max-h-80 overflow-y-auto space-y-3">
            {wordsArray.map(({ word }) => (
              <ReviewListItem
                key={word.id}
                word={word}
                onDelete={onDeleteWord}
              />
            ))}
          </div>
          <button
            onClick={onStartLoopingTest}
            className="mt-6 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition"
          >
            Start Looping Test
          </button>
        </>
      ) : (
        <p className="text-center text-slate-500 dark:text-slate-400 py-8">
          You haven't marked any words as difficult yet. Swipe down on a word during a study session to add it here.
        </p>
      )}
    </div>
  );
};

export default ReviewScreen;