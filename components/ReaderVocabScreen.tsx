
import React from 'react';
import ReaderVocabListItem from './ReaderVocabListItem';

interface ReaderVocabScreenProps {
  readerWords: Map<string, string>;
  onBack: () => void;
  onDeleteWord: (word: string) => void;
}

const ReaderVocabScreen: React.FC<ReaderVocabScreenProps> = ({ readerWords, onBack, onDeleteWord }) => {
  const wordsArray = Array.from(readerWords.entries());

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg w-full max-w-sm mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Reader's Vocabulary</h2>
        <button onClick={onBack} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          &larr; Back to Home
        </button>
      </div>

       <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">Swipe right on a word to delete it.</p>

      {wordsArray.length > 0 ? (
        <div className="max-h-96 overflow-y-auto space-y-3">
          {wordsArray.map(([word, translation]) => (
            <ReaderVocabListItem
              key={word}
              word={word}
              translation={translation}
              onDelete={onDeleteWord}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-slate-500 dark:text-slate-400 py-8">
          You haven't collected any words from reading yet. Click on words in 'Jane Eyre' to add them here.
        </p>
      )}
    </div>
  );
};

export default ReaderVocabScreen;
