import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { janeEyreChapters } from '../data/janeEyre';
import { dictionary } from '../data/dictionary';
import Chapter from './Chapter';
import { getChineseTranslation, preloadTranslations } from '../services/translationService';

interface ReaderScreenProps {
  onBack: () => void;
  setReaderWords: React.Dispatch<React.SetStateAction<Map<string, string>>>;
}

const FONT_SIZE_KEY = 'novelvocab-reader-font-size';
// 字号范围：14px - 26px，每档 2px
const FONT_SIZES = [14, 16, 18, 20, 22, 24, 26];
const DEFAULT_FONT_SIZE_INDEX = 1; // 16px


const ReaderScreen: React.FC<ReaderScreenProps> = ({ onBack, setReaderWords }) => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [selectedWord, setSelectedWord] = useState<{ word: string; translation: string; position: { top: number; left: number } } | null>(null);
  const [showChapterSelect, setShowChapterSelect] = useState(false);
  const [showFontSettings, setShowFontSettings] = useState(false);
  const [showControls, setShowControls] = useState(false); // 默认隐藏控制栏（沉浸模式）
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('novel-dark-mode') === 'true' || document.documentElement.classList.contains('dark');
  });
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && FONT_SIZES.includes(parsed)) return parsed;
    }
    return FONT_SIZES[DEFAULT_FONT_SIZE_INDEX];
  });

  const tooltipRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Use refs to avoid stale closures
  const setReaderWordsRef = useRef(setReaderWords);
  useEffect(() => {
    setReaderWordsRef.current = setReaderWords;
  }, [setReaderWords]);

  // 预加载中文翻译词库
  useEffect(() => {
    preloadTranslations();
  }, []);

  // 字体设置持久化
  useEffect(() => {
    localStorage.setItem(FONT_SIZE_KEY, fontSize.toString());
  }, [fontSize]);

  // 黑夜模式处理
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('novel-dark-mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('novel-dark-mode', 'false');
    }
  }, [isDarkMode]);

  // Clear selected word when chapter changes
  useEffect(() => {
    setSelectedWord(null);
  }, [currentChapter]);

  // 滚动或移动鼠标时关闭翻译弹窗
  useEffect(() => {
    if (!selectedWord) return;
    const handleAction = () => setSelectedWord(null);
    const container = contentRef.current;
    const timer = setTimeout(() => {
      // 监听内部容器的滚动事件
      container?.addEventListener('scroll', handleAction, { passive: true });
      // 监听全局触摸移动事件
      window.addEventListener('touchmove', handleAction, { passive: true });
    }, 100);
    return () => {
      clearTimeout(timer);
      container?.removeEventListener('scroll', handleAction);
      window.removeEventListener('touchmove', handleAction);
    };
  }, [selectedWord]);

  // Stable handleWordClick using useCallback with refs to avoid stale closures
  const handleWordClick = useCallback((word: string, event: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    setShowChapterSelect(false);
    setShowFontSettings(false);

    let cleanedWord = word.replace(/^[.,;:"'!?“"—–—]+|[.,;:"'!?“"—–—]+$/g, "").toLowerCase();
    let translation: string | undefined = undefined;
    let foundWord = cleanedWord;

    if (cleanedWord && dictionary[cleanedWord]) {
      translation = dictionary[cleanedWord];
    } else if (cleanedWord) {
      const withoutHyphens = cleanedWord.replace(/-/g, '');
      if (dictionary[withoutHyphens]) {
        translation = dictionary[withoutHyphens];
        foundWord = withoutHyphens;
      } else {
        const beforeHyphen = cleanedWord.split('-')[0];
        if (beforeHyphen && dictionary[beforeHyphen]) {
          translation = dictionary[beforeHyphen];
          foundWord = beforeHyphen;
        } else {
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

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    if (translation) {
      setSelectedWord({
        word: foundWord,
        translation,
        position: { top: rect.bottom + 5, left: rect.left + rect.width / 2 },
      });
      setReaderWordsRef.current(prev => new Map(prev).set(foundWord, translation));
    } else {
      setSelectedWord({
        word: cleanedWord,
        translation: '(查询中...)',
        position: { top: rect.bottom + 5, left: rect.left + rect.width / 2 },
      });

      getChineseTranslation(cleanedWord).then(chineseTranslation => {
        if (chineseTranslation) {
          setSelectedWord(prev => prev ? { ...prev, translation: chineseTranslation } : null);
          setReaderWordsRef.current(prev => new Map(prev).set(cleanedWord, chineseTranslation));
        } else {
          setSelectedWord(prev => prev ? { ...prev, translation: '(词库中暂无此单词)' } : null);
        }
      });
    }
  }, []);

  // 点击屏幕空白处：关闭翻译弹窗或菜单
  const handleScreenClick = useCallback((e: React.MouseEvent) => {
    if (selectedWord) {
      setSelectedWord(null);
    }
    setShowChapterSelect(false);
    setShowFontSettings(false);
  }, [selectedWord]);

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
      } else if (baseLeft + (tooltipWidth / 2) > windowWidth - 10) {
        tooltip.style.left = `${windowWidth - 10}px`;
        tooltip.style.transform = 'translateX(-100%)';
      } else {
        tooltip.style.left = `${baseLeft}px`;
        tooltip.style.transform = 'translateX(-50%)';
      }
    }
  }, [selectedWord]);

  const resetScroll = () => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  const goToNextChapter = () => {
    if (currentChapter < janeEyreChapters.length - 1) {
      setCurrentChapter(currentChapter + 1);
      resetScroll();
    }
  };

  const goToPrevChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1);
      resetScroll();
    }
  };

  const selectChapter = (index: number) => {
    setCurrentChapter(index);
    setShowChapterSelect(false);
    resetScroll();
  }

  return (
    // 全屏容器
    <div
      className="fixed inset-0 z-50 bg-[#fafafa] dark:bg-[#1a1a1a] flex flex-col transition-colors duration-300"
      onClick={handleScreenClick}
    >
      {/* 头部导航栏 - 始终显示 */}
      <div className="flex-none h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-sm flex items-center justify-between px-4 z-20 transition-transform duration-300">
        <button onClick={onBack} className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 p-2">
          ← Back
        </button>
        <span className="font-bold text-slate-800 dark:text-gray-100 text-sm truncate max-w-[50%]">
          Jane Eyre
        </span>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowChapterSelect(prev => !prev); setShowFontSettings(false); }}
            className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Ch. {currentChapter + 1}
          </button>
          {showChapterSelect && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl z-30 max-h-[60vh] overflow-y-auto border border-slate-100 dark:border-slate-700">
              {janeEyreChapters.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); selectChapter(index); }}
                  className={`w-full text-left px-4 py-3 text-sm border-b border-slate-50 dark:border-slate-700 last:border-0 ${currentChapter === index ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  Chapter {index + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 正文区域 - 占据剩余空间 */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-5 sm:px-8 py-8 scroll-smooth text-justify"
        onClick={handleScreenClick}
      >
        <div className={`max-w-xl mx-auto transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
          <Chapter key={currentChapter} text={janeEyreChapters[currentChapter]} onWordClick={handleWordClick} fontSize={fontSize} />
        </div>
      </div>

      {/* 底部功能栏 - 始终显示 */}
      <div className="flex-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-100 dark:border-slate-800 z-20 transition-transform duration-300">
        <div className="flex items-center justify-between px-6 py-3 max-w-xl mx-auto">
          {/* 上一章 */}
          <button onClick={goToPrevChapter} disabled={currentChapter === 0} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full disabled:opacity-30">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>

          <div className="flex items-center space-x-6">
            {/* 字体设置 */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowFontSettings(s => !s); setShowChapterSelect(false); }}
                className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                <span className="text-lg font-serif">Aa</span>
              </button>
              {showFontSettings && (
                <div onClick={e => e.stopPropagation()} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 p-3 flex items-center gap-3 z-30">
                  <button
                    onClick={() => setFontSize(prev => Math.max(FONT_SIZES[0], prev - 2))}
                    disabled={fontSize <= FONT_SIZES[0]}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[40px] text-center">
                    {fontSize}px
                  </span>
                  <button
                    onClick={() => setFontSize(prev => Math.min(FONT_SIZES[FONT_SIZES.length - 1], prev + 2))}
                    disabled={fontSize >= FONT_SIZES[FONT_SIZES.length - 1]}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {/* 黑夜模式切换 */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsDarkMode(d => !d); }}
              className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
          </div>

          {/* 下一章 */}
          <button onClick={goToNextChapter} disabled={currentChapter === janeEyreChapters.length - 1} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full disabled:opacity-30">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {selectedWord && (
        <div
          ref={tooltipRef}
          className="fixed bg-slate-800/90 backdrop-blur-md text-white text-sm rounded-lg px-4 py-2.5 shadow-xl animate-fade-in-fast z-[60] pointer-events-none max-w-[80vw]"
          style={{ top: 0, left: 0 }}
        >
          <span className="font-chinese leading-normal">{selectedWord.translation}</span>
        </div>
      )}
    </div>
  );
};

export default ReaderScreen;