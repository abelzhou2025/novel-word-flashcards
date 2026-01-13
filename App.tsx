
import React, { useState, useCallback, useEffect } from 'react';
import SetupScreen from './components/SetupScreen';
import StudyScreen from './components/StudyScreen';
import ReviewScreen from './components/ReviewScreen';
import ReaderScreen from './components/ReaderScreen';
import ReaderVocabScreen from './components/ReaderVocabScreen';
import { VocabularySource, Word, DifficultWordEntry } from './types';

const DIFFICULT_WORDS_KEY = 'novelvocab-difficult-words';
const READER_WORDS_KEY = 'novelvocab-reader-words';
const STUDIED_WORDS_KEY = 'novelvocab-studied-words';
const MAX_STUDY_HISTORY = 200;

const App: React.FC = () => {
  const [words, setWords] = useState<Word[] | null>(null);
  const [currentVocabulary, setCurrentVocabulary] = useState<VocabularySource | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<'setup' | 'study' | 'review' | 'review-study' | 'reader' | 'reader-vocab'>('setup');

  const [difficultWords, setDifficultWords] = useState<Map<string, DifficultWordEntry>>(() => {
    try {
      const savedWords = window.localStorage.getItem(DIFFICULT_WORDS_KEY);
      if (savedWords) {
        const parsedArray: [string, DifficultWordEntry][] = JSON.parse(savedWords);
        return new Map(parsedArray);
      }
    } catch (err) {
      console.error("Failed to load difficult words from local storage:", err);
    }
    return new Map();
  });

  const [readerWords, setReaderWords] = useState<Map<string, string>>(() => {
    try {
      const savedWords = window.localStorage.getItem(READER_WORDS_KEY);
      if (savedWords) {
        return new Map(JSON.parse(savedWords));
      }
    } catch (err) {
      console.error("Failed to load reader words from local storage:", err);
    }
    return new Map();
  });

  const [studiedWordIds, setStudiedWordIds] = useState<string[]>(() => {
    try {
      const savedIds = window.localStorage.getItem(STUDIED_WORDS_KEY);
      if (savedIds) {
        return JSON.parse(savedIds);
      }
    } catch (err) {
      console.error("Failed to load studied words history from local storage:", err);
    }
    return [];
  });

  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    try {
      const wordsArray = Array.from(difficultWords.entries());
      window.localStorage.setItem(DIFFICULT_WORDS_KEY, JSON.stringify(wordsArray));
    } catch (err) {
      console.error("Failed to save difficult words to local storage:", err);
    }
  }, [difficultWords]);

  useEffect(() => {
    try {
      window.localStorage.setItem(READER_WORDS_KEY, JSON.stringify(Array.from(readerWords.entries())));
    } catch (err) {
      console.error("Failed to save reader words to local storage:", err);
    }
  }, [readerWords]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STUDIED_WORDS_KEY, JSON.stringify(studiedWordIds));
    } catch (err) {
      console.error("Failed to save studied words history to local storage:", err);
    }
  }, [studiedWordIds]);

  const handleStartStudy = useCallback((vocabulary: VocabularySource, generatedWords: Word[]) => {
    setCurrentVocabulary(vocabulary);
    setWords(generatedWords);
    setIsLoading(false);
    setView('study');
    setSessionKey(prev => prev + 1);

    const newWordIds = generatedWords.map(w => w.id);
    setStudiedWordIds(prevIds => {
      const updatedIds = [...newWordIds, ...prevIds.filter(id => !newWordIds.includes(id))];
      return updatedIds.slice(0, MAX_STUDY_HISTORY);
    });
  }, []);

  const handleGoToSetup = useCallback(() => {
    setWords(null);
    setCurrentVocabulary(null);
    setError(null);
    setView('setup');
  }, []);

  const handleGoToReview = useCallback(() => {
    setView('review');
  }, []);

  const handleGoToReader = useCallback(() => {
    setView('reader');
  }, []);

  const handleGoToReaderVocab = useCallback(() => {
    setView('reader-vocab');
  }, []);

  const handleStartLoopingTest = useCallback(() => {
    setView('review-study');
    setSessionKey(prev => prev + 1);
  }, []);

  const handleLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  const handleDeleteDifficultWord = useCallback((wordId: string) => {
    setDifficultWords(prev => {
      const newMap = new Map(prev);
      newMap.delete(wordId);
      return newMap;
    });
  }, []);

  const handleDeleteReaderWord = useCallback((word: string) => {
    setReaderWords(prev => {
      const newMap = new Map(prev);
      newMap.delete(word);
      return newMap;
    });
  }, []);


  const renderContent = () => {
    switch (view) {
      case 'study':
        return (
          <StudyScreen
            key={sessionKey}
            words={words!}
            vocabulary={currentVocabulary!}
            onBack={handleGoToSetup}
            difficultWords={difficultWords}
            setDifficultWords={setDifficultWords}
          />
        );
      case 'review':
        return (
          <ReviewScreen
            difficultWords={difficultWords}
            onBack={handleGoToSetup}
            onDeleteWord={handleDeleteDifficultWord}
            onStartLoopingTest={handleStartLoopingTest}
          />
        );
      case 'review-study':
        const reviewWords = Array.from(difficultWords.values()).map((entry: DifficultWordEntry) => entry.word);
        if (reviewWords.length === 0) {
          handleGoToReview();
          return null;
        }
        return (
          <StudyScreen
            key={sessionKey}
            words={reviewWords}
            vocabulary={null}
            onBack={handleGoToReview}
            difficultWords={difficultWords}
            setDifficultWords={setDifficultWords}
            isLoopingMode={true}
          />
        );
      case 'reader':
        return (
          <ReaderScreen
            onBack={handleGoToSetup}
            setReaderWords={setReaderWords}
          />
        );
      case 'reader-vocab':
        return (
          <ReaderVocabScreen
            readerWords={readerWords}
            onBack={handleGoToSetup}
            onDeleteWord={handleDeleteReaderWord}
          />
        );
      case 'setup':
      default:
        return (
          <SetupScreen
            onStart={handleStartStudy}
            isLoading={isLoading}
            onLoading={handleLoading}
            onError={handleError}
            error={error}
            onGoToReview={handleGoToReview}
            onGoToReader={handleGoToReader}
            onGoToReaderVocab={handleGoToReaderVocab}
            hasDifficultWords={difficultWords.size > 0}
            hasReaderWords={readerWords.size > 0}
            studiedWordIds={studiedWordIds}
          />
        );
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white">WordCards</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Your personalized vocabulary builder.</p>
        </header>
        <main className="w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
