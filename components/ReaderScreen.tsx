import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { janeEyreChapters } from '../data/janeEyre';
import { dictionary } from '../data/dictionary';
import Chapter from './Chapter';

interface ReaderScreenProps {
  onBack: () => void;
  setReaderWords: React.Dispatch<React.SetStateAction<Map<string, string>>>;
}

const FONT_SIZE_KEY = 'novelvocab-reader-font-size';
const FONT_SIZES = {
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
};
type FontSize = keyof typeof FONT_SIZES;


const ReaderScreen: React.FC<ReaderScreenProps> = ({ onBack, setReaderWords }) => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [selectedWord, setSelectedWord] = useState<{ word: string; translation: string; position: { top: number; left: number } } | null>(null);
  const [showChapterSelect, setShowChapterSelect] = useState(false);
  const [showFontSettings, setShowFontSettings] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    return (localStorage.getItem(FONT_SIZE_KEY) as FontSize) || 'base';
  });

  const tooltipRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Use refs to avoid stale closures
  const setReaderWordsRef = useRef(setReaderWords);
  useEffect(() => {
    setReaderWordsRef.current = setReaderWords;
  }, [setReaderWords]);

  useEffect(() => {
    localStorage.setItem(FONT_SIZE_KEY, fontSize);
  }, [fontSize]);

  // Clear selected word when chapter changes
  useEffect(() => {
    setSelectedWord(null);
  }, [currentChapter]);

  // Stable handleWordClick using useCallback with refs to avoid stale closures
  const handleWordClick = useCallback((word: string, event: React.MouseEvent) => {
    // Prevent event from bubbling to parent elements
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    setShowChapterSelect(false);
    setShowFontSettings(false);
    
    // Clean the word: remove leading/trailing punctuation
    let cleanedWord = word.replace(/^[.,;:"'!?“"—–—]+|[.,;:"'!?“"—–—]+$/g, "").toLowerCase();
    
    // Try to find translation with multiple strategies
    let translation: string | undefined = undefined;
    let foundWord = cleanedWord;
    
    // Strategy 1: Direct lookup
    if (cleanedWord && dictionary[cleanedWord]) {
      translation = dictionary[cleanedWord];
    } else if (cleanedWord) {
      // Strategy 2: Try without hyphens (e.g., "drawing-room" -> "drawingroom" or "drawing")
      const withoutHyphens = cleanedWord.replace(/-/g, '');
      if (dictionary[withoutHyphens]) {
        translation = dictionary[withoutHyphens];
        foundWord = withoutHyphens;
      } else {
        // Strategy 3: Try the first part before hyphen (e.g., "drawing-room" -> "drawing")
        const beforeHyphen = cleanedWord.split('-')[0];
        if (beforeHyphen && dictionary[beforeHyphen]) {
          translation = dictionary[beforeHyphen];
          foundWord = beforeHyphen;
        } else {
          // Strategy 4: Try removing common suffixes
          const suffixes = ['ed', 'ing', 's', 'es', 'ly', 'er', 'est', 'tion', 'sion'];
          for (const suffix of suffixes) {
            if (cleanedWord.endsWith(suffix) && cleanedWord.length > suffix.length) {
              const withoutSuffix = cleanedWord.slice(0, -suffix.length);
              if (dictionary[withoutSuffix]) {
                translation = dictionary[withoutSuffix];
                foundWord = withoutSuffix;
                break;
              }
            }
          }
        }
      }
    }
    
    if (translation) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setSelectedWord({
        word: foundWord,
        translation,
        position: { top: rect.bottom + window.scrollY + 5, left: rect.left + rect.width / 2 },
      });
      // Use ref to avoid dependency on setReaderWords
      setReaderWordsRef.current(prev => new Map(prev).set(foundWord, translation));
    } else {
      setSelectedWord(null);
    }
  }, []); // Empty dependencies - using refs to access latest values
  
  const handleScreenClick = useCallback((e: React.MouseEvent) => {
    // Only handle clicks on the background container itself, not on child elements
    if (e.target === e.currentTarget) {
      if(selectedWord) setSelectedWord(null);
      if (showChapterSelect) setShowChapterSelect(false);
      if (showFontSettings) setShowFontSettings(false);
    }
  }, [selectedWord, showChapterSelect, showFontSettings]);

  useEffect(() => {
    if (selectedWord && tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const { width: tooltipWidth } = tooltip.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const baseLeft = selectedWord.position.left;
      const top = selectedWord.position.top;

      tooltip.style.top = `${top}px`;

      const centeredLeft = baseLeft - (tooltipWidth / 2);
      
      if (centeredLeft < 10) {
        tooltip.style.left = '10px';
        tooltip.style.transform = 'translateX(0)';
      } 
      else if (baseLeft + (tooltipWidth / 2) > windowWidth - 10) {
        tooltip.style.left = `${windowWidth - 10}px`;
        tooltip.style.transform = 'translateX(-100%)';
      } 
      else {
        tooltip.style.left = `${baseLeft}px`;
        tooltip.style.transform = 'translateX(-50%)';
      }
    }
  }, [selectedWord]);
  
  const resetScroll = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  const goToNextChapter = () => {
    if (currentChapter < janeEyreChapters.length - 1) {
      setCurrentChapter(currentChapter + 1);
      // selectedWord will be cleared by useEffect when currentChapter changes
      resetScroll();
    }
  };

  const goToPrevChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1);
      // selectedWord will be cleared by useEffect when currentChapter changes
      resetScroll();
    }
  };
  
  const selectChapter = (index: number) => {
    setCurrentChapter(index);
    setShowChapterSelect(false);
    // selectedWord will be cleared by useEffect when currentChapter changes
    resetScroll();
  }

  return (
    <div className="w-full max-w-2xl mx-auto" onClick={handleScreenClick}>
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg animate-fade-in relative">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onBack} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            &larr; Back
          </button>
          
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Jane Eyre</h2>
          
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowChapterSelect(prev => !prev); setShowFontSettings(false); }}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              Ch. {currentChapter + 1} &#9662;
            </button>
            {showChapterSelect && (
              <div onClick={e => e.stopPropagation()} className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto ring-1 ring-black ring-opacity-5">
                <ul className="py-1">
                  {janeEyreChapters.map((_, index) => (
                    <li key={index}>
                      <a href="#" onClick={(e) => { e.preventDefault(); selectChapter(index); }}
                        className={`block px-4 py-2 text-sm ${currentChapter === index ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'} hover:bg-slate-100 dark:hover:bg-slate-600`}>
                        Chapter {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div ref={contentRef} className="h-[60vh] overflow-y-auto pr-4 text-justify leading-relaxed scroll-smooth">
          <Chapter key={currentChapter} text={janeEyreChapters[currentChapter]} onWordClick={handleWordClick} fontSize={FONT_SIZES[fontSize]} />
        </div>

        <div className="flex justify-between items-center mt-6 relative">
          <button
            onClick={goToPrevChapter}
            disabled={currentChapter === 0}
            className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition disabled:opacity-50 w-1/3"
          >
            Previous
          </button>

          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowFontSettings(s => !s); setShowChapterSelect(false);}} 
              className="text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition w-12 h-10 flex items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700"
              aria-label="Adjust font size"
            >
                <span className="font-bold text-xl leading-none select-none">Aa</span>
            </button>
            {showFontSettings && (
                <div onClick={e => e.stopPropagation()} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-white dark:bg-slate-700 rounded-lg shadow-lg z-20 ring-1 ring-black ring-opacity-5 p-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 px-2 text-center">Font Size</p>
                    <div className="flex justify-around items-center">
                        {(Object.keys(FONT_SIZES) as FontSize[]).map(sizeKey => (
                            <button key={sizeKey} onClick={() => setFontSize(sizeKey)} className={`w-10 h-10 rounded-md flex items-center justify-center ${fontSize === sizeKey ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500'}`}>
                                <span className={sizeKey === 'sm' ? 'text-sm' : sizeKey === 'lg' ? 'text-xl' : 'text-base'}>Aa</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
          </div>

          <button
            onClick={goToNextChapter}
            disabled={currentChapter === janeEyreChapters.length - 1}
            className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 w-1/3"
          >
            Next
          </button>
        </div>

        {selectedWord && (
          <div
            ref={tooltipRef}
            className="fixed bg-slate-900 text-white text-sm rounded-md px-3 py-2 shadow-lg animate-fade-in-fast z-50 pointer-events-none"
            style={{ top: 0, left: 0 }}
          >
            <span className="font-chinese">{selectedWord.translation}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReaderScreen;