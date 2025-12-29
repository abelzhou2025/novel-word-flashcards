import React, { useState, useMemo, useCallback } from 'react';
import WordCard from './WordCard';
import { Vocabulary, Word, DifficultWordEntry } from '../types';

interface StudyScreenProps {
  words: Word[];
  vocabulary: Vocabulary | null;
  onBack: () => void;
  difficultWords: Map<string, DifficultWordEntry>;
  setDifficultWords: React.Dispatch<React.SetStateAction<Map<string, DifficultWordEntry>>>;
  isLoopingMode?: boolean;
}

const StudyScreen: React.FC<StudyScreenProps> = ({ words, vocabulary, onBack, difficultWords, setDifficultWords, isLoopingMode = false }) => {
  const [initialWordCount] = useState(words.length);
  const [deck, setDeck] = useState<Word[]>(() => [...words].sort(() => Math.random() - 0.5));
  const [viewedWords, setViewedWords] = useState(new Set<string>());
  const [knownCount, setKnownCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);
  const [showSummary, setShowSummary] = useState(words.length === 0);

  const handleSwipe = useCallback((word: Word, direction: 'up' | 'down') => {
    if (!isLoopingMode) {
      setViewedWords(prev => new Set(prev).add(word.id));
      if (direction === 'up') {
        setKnownCount(c => c + 1);
      } else {
        setUnknownCount(c => c + 1);
      }
    }

    setDifficultWords(prev => {
      const newMap = new Map<string, DifficultWordEntry>(prev);
      if (isLoopingMode) {
        if (direction === 'down') {
          if (newMap.has(word.id)) {
            newMap.set(word.id, { word, knownCount: 0 });
          }
        } else { // 'up'
          const entry = newMap.get(word.id);
          if (entry) {
            const newCount = entry.knownCount + 1;
            if (newCount >= 2) {
              newMap.delete(word.id);
            } else {
              newMap.set(word.id, { ...entry, knownCount: newCount });
            }
          }
        }
      } else { // Normal Mode
        if (direction === 'up') { // Know
          const entry = newMap.get(word.id);
          if (entry) {
            const newCount = entry.knownCount + 1;
            if (newCount >= 2) {
              newMap.delete(word.id);
            } else {
              newMap.set(word.id, { ...entry, knownCount: newCount });
            }
          }
        } else { // 'down', Don't Know
          newMap.set(word.id, { word, knownCount: 0 });
        }
      }
      return newMap;
    });
    
    setDeck(currentDeck => {
      let newDeck = currentDeck.slice(1);
      if (isLoopingMode && direction === 'down') {
        newDeck.push(word);
      }
      // Set showSummary when deck becomes empty
      if (newDeck.length === 0) {
        setShowSummary(true);
      }
      return newDeck;
    });
  }, [isLoopingMode, setDifficultWords]);

  // All hooks must be called before any conditional returns
  const progress = useMemo(() => {
    if (deck.length === 0) return 100;
    return isLoopingMode
      ? ((initialWordCount - deck.length) / initialWordCount) * 100
      : (viewedWords.size / initialWordCount) * 100;
  }, [deck.length, initialWordCount, isLoopingMode, viewedWords.size]);

  const visibleCards = useMemo(() => {
    return deck.slice(0, 3).reverse();
  }, [deck]);

  const backButtonText = useMemo(() => {
    if (isLoopingMode) return '\u2190 Back to Review List';
    return '\u2190 Change Level';
  }, [isLoopingMode]);

  // Now safe to do conditional return after all hooks
  if (showSummary || deck.length === 0) {
    let buttonText = isLoopingMode ? "Back to Review List" : "Start New Session";
    
    return (
      <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg w-full max-w-sm mx-auto animate-fade-in">
        <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{isLoopingMode ? "Review Complete!" : "Session Complete!"}</h2>
        {isLoopingMode ? (
            <p className="mt-4 text-slate-600 dark:text-slate-300">You've finished this review pass. Check your difficult words list to see your progress.</p>
        ) : (
            <>
                <p className="mt-4 text-slate-600 dark:text-slate-300">You've reviewed all the words for this session.</p>
                <div className="mt-6 space-y-2 text-left">
                    <p><strong className="text-slate-800 dark:text-white">Total words tested:</strong> {words.length}</p>
                    <p><strong className="text-green-500">Knew:</strong> {knownCount}</p>
                    <p><strong className="text-red-500">Didn't know:</strong> {unknownCount}</p>
                </div>
            </>
        )}
        <button onClick={onBack} className="mt-8 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition">
          {buttonText}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
                 <button onClick={onBack} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                    {backButtonText}
                </button>
                 <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    {isLoopingMode
                        ? `${initialWordCount - deck.length} / ${initialWordCount} Done`
                        : `${viewedWords.size} / ${initialWordCount}`
                    }
                 </span>
            </div>
           
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-6">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}></div>
            </div>

            <div className="relative h-96 w-full flex items-center justify-center">
                {visibleCards.length > 0 ? (
                  visibleCards.map((word, index) => (
                      <WordCard
                          key={word.id}
                          word={word}
                          onSwipe={handleSwipe}
                          isActive={index === visibleCards.length - 1}
                          zIndex={index}
                      />
                  ))
                ) : null}
            </div>
             <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 px-4">
                <p>Swipe Down: Don't Know | Swipe Up: Know</p>
            </div>
        </div>

        {!isLoopingMode && difficultWords.size > 0 && (
            <div className="w-full max-w-sm mt-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg animate-fade-in">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3 text-center text-sm">Review List</h3>
                <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                    {Array.from(difficultWords.values()).map(({ word: difficultWord, knownCount }) => (
                    <div key={difficultWord.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{difficultWord.word}</span>
                        <span className="font-chinese text-slate-500 dark:text-slate-400 mr-auto ml-4 truncate">{difficultWord.translation}</span>
                        <span className="flex flex-shrink-0">
                        <span className={`w-2 h-2 rounded-full ${knownCount > 0 ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                        <span className={`w-2 h-2 rounded-full ml-1 ${knownCount > 1 ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                        </span>
                    </div>
                    ))}
                </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default StudyScreen;