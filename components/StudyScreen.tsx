import React, { useState, useMemo, useCallback } from 'react';
import WordCard from './WordCard';
import { Vocabulary, Word, DifficultWordEntry } from '../types';
import { updateMastery } from '../services/masteryService';

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

  // 处理查看译文（用于更新掌握度权重）
  const handleRevealTranslation = useCallback((word: Word) => {
    updateMastery(word.id, 'view');
  }, []);

  const handleSwipe = useCallback((word: Word, direction: 'up' | 'down') => {
    if (!isLoopingMode) {
      setViewedWords(prev => new Set(prev).add(word.id));
      if (direction === 'up') {
        setKnownCount(c => c + 1);
        updateMastery(word.id, 'known');  // 更新掌握度
      } else {
        setUnknownCount(c => c + 1);
        updateMastery(word.id, 'unknown');  // 更新掌握度
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
    if (isLoopingMode) return '\u2190 返回复习列表';
    return '\u2190 更换词库';
  }, [isLoopingMode]);

  // 获取单词的翻译文本（用于复习列表显示）
  const getWordTranslation = (word: Word): string => {
    if (word.translations && word.translations.length > 0) {
      return word.translations.map(t => t.translation).join('；');
    }
    return word.translation || '';
  };

  // Now safe to do conditional return after all hooks
  if (showSummary || deck.length === 0) {
    let buttonText = isLoopingMode ? "返回复习列表" : "开始新的学习";

    return (
      <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg w-full max-w-sm mx-auto animate-fade-in">
        <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{isLoopingMode ? "复习完成！" : "学习完成！"}</h2>
        {isLoopingMode ? (
          <p className="mt-4 text-slate-600 dark:text-slate-300">你已完成本轮复习。继续加油！</p>
        ) : (
          <>
            <p className="mt-4 text-slate-600 dark:text-slate-300">你已完成本次学习任务。</p>
            <div className="mt-6 space-y-2 text-left">
              <p><strong className="text-slate-800 dark:text-white">测试单词数:</strong> {words.length}</p>
              <p><strong className="text-green-500">认识:</strong> {knownCount}</p>
              <p><strong className="text-red-500">不认识:</strong> {unknownCount}</p>
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
              ? `${initialWordCount - deck.length} / ${initialWordCount} 完成`
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
                onRevealTranslation={handleRevealTranslation}
                isActive={index === visibleCards.length - 1}
                zIndex={index}
              />
            ))
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default StudyScreen;