import React, { useState, useRef, useEffect, memo } from 'react';
import { Word } from '../types';
import {
  fetchEnglishDefinition,
  getShortDefinition,
  getSynonyms,
  getExampleSentence
} from '../services/dictionaryService';

interface WordCardProps {
  word: Word;
  onSwipe: (word: Word, direction: 'up' | 'down') => void;
  onRevealTranslation?: (word: Word) => void;  // 点击查看译文回调
  isActive: boolean;
  zIndex: number;
}

const SWIPE_THRESHOLD_Y = 60;

const WordCard: React.FC<WordCardProps> = ({ word, onSwipe, onRevealTranslation, isActive, zIndex }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);  // 控制译文显示
  const [englishHint, setEnglishHint] = useState<string>('Loading...');  // 英文提示
  const startPosRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const opacity = 1 - Math.abs(position.y) / 250;

  // 获取英文释义
  useEffect(() => {
    let cancelled = false;

    const loadDefinition = async () => {
      setEnglishHint('Loading...');

      const entry = await fetchEnglishDefinition(word.word);

      if (cancelled) return;

      if (entry) {
        // 优先显示例句，其次是定义+同义词
        const example = getExampleSentence(entry);
        if (example) {
          setEnglishHint(`"${example}"`);
          return;
        }

        const definition = getShortDefinition(entry);
        const synonyms = getSynonyms(entry);

        if (definition) {
          let hint = definition;
          if (synonyms.length > 0) {
            hint += ` (= ${synonyms.slice(0, 2).join(', ')})`;
          }
          setEnglishHint(hint);
        } else if (synonyms.length > 0) {
          setEnglishHint(`Synonyms: ${synonyms.join(', ')}`);
        } else {
          setEnglishHint(`Think about the meaning of "${word.word}".`);
        }
      } else {
        // API 无数据时的后备
        setEnglishHint(`Think about the meaning of "${word.word}".`);
      }
    };

    loadDefinition();

    return () => { cancelled = true; };
  }, [word.word]);

  // 获取翻译文本
  const getTranslationText = (): string => {
    // 优先使用 translations 数组
    if (word.translations && word.translations.length > 0) {
      return word.translations.map(t =>
        t.type ? `${t.type}. ${t.translation}` : t.translation
      ).join('；');
    }
    // 兼容旧格式
    return word.translation || '暂无翻译';
  };

  // 点击显示译文
  const handleRevealClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showTranslation) {
      setShowTranslation(true);
      onRevealTranslation?.(word);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !isActive) return;
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      positionRef.current = { x: dx, y: dy };
      setPosition({ x: dx, y: dy });
    };

    const handleMouseUp = () => {
      if (!isDragging || !isActive) return;
      setIsDragging(false);

      const currentPosition = positionRef.current;
      if (currentPosition.y < -SWIPE_THRESHOLD_Y) {
        onSwipe(word, 'up');
      } else if (currentPosition.y > SWIPE_THRESHOLD_Y) {
        onSwipe(word, 'down');
      } else {
        positionRef.current = { x: 0, y: 0 };
        setPosition({ x: 0, y: 0 });
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isActive, word, onSwipe]);

  const handleDragStart = (clientX: number, clientY: number) => {
    if (!isActive) return;
    setIsDragging(true);
    startPosRef.current = { x: clientX, y: clientY };
    positionRef.current = { x: 0, y: 0 };
    setPosition({ x: 0, y: 0 });
  };

  const handleTouchMove = (clientX: number, clientY: number) => {
    if (!isDragging || !isActive) return;
    const dx = clientX - startPosRef.current.x;
    const dy = clientY - startPosRef.current.y;
    positionRef.current = { x: dx, y: dy };
    setPosition({ x: dx, y: dy });
  };

  const handleTouchEnd = () => {
    if (!isDragging || !isActive) return;
    setIsDragging(false);

    const currentPosition = positionRef.current;
    if (currentPosition.y < -SWIPE_THRESHOLD_Y) {
      onSwipe(word, 'up');
    } else if (currentPosition.y > SWIPE_THRESHOLD_Y) {
      onSwipe(word, 'down');
    } else {
      positionRef.current = { x: 0, y: 0 };
      setPosition({ x: 0, y: 0 });
    }
  };

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleTouchMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleTouchEnd();
  };

  // 重置状态当单词变化时
  useEffect(() => {
    positionRef.current = { x: 0, y: 0 };
    setPosition({ x: 0, y: 0 });
    setShowTranslation(false);  // 重置译文显示状态
  }, [word]);

  const dynamicStyle = {
    transform: `translate(${position.x}px, ${position.y}px) scale(${isActive ? 1 : 0.95})`,
    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    opacity: isActive ? opacity : 1,
    zIndex: zIndex,
    top: isActive ? 0 : `${(3 - zIndex) * -10}px`,
    touchAction: 'none' as const,
  };

  let borderColorClass = 'border-transparent';
  if (isDragging) {
    if (position.y > SWIPE_THRESHOLD_Y * 0.7) {
      borderColorClass = 'border-red-500';  // 下滑 = 不认识
    } else if (position.y < -SWIPE_THRESHOLD_Y * 0.7) {
      borderColorClass = 'border-green-500';  // 上滑 = 认识
    }
  }

  return (
    <div
      ref={cardRef}
      className={`absolute w-full h-full p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col justify-center items-center text-center cursor-grab select-none border-4 ${borderColorClass} transition-all duration-200 ${isActive ? 'cursor-grabbing' : ''} will-change-transform`}
      style={dynamicStyle}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* 单词 */}
      <h2 className="text-5xl font-bold text-slate-800 dark:text-white mb-2">{word.word}</h2>

      {/* 音标 */}
      {word.pronunciation && (
        <p className="text-xl text-slate-500 dark:text-slate-400 mb-4">{word.pronunciation}</p>
      )}

      {/* 英文提示 */}
      <div className="mb-6 px-6 py-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg max-w-full">
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          {englishHint}
        </p>
      </div>

      {/* 译文区域（可模糊） */}
      <div
        onClick={handleRevealClick}
        className={`
          px-4 py-3 rounded-lg cursor-pointer transition-all duration-300
          ${!showTranslation
            ? 'blur-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
            : 'bg-indigo-50 dark:bg-indigo-900/30'
          }
        `}
      >
        <p className="text-xl text-indigo-600 dark:text-indigo-400 font-medium font-chinese">
          {getTranslationText()}
        </p>
        {!showTranslation && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            点击查看释义
          </p>
        )}
      </div>

      {/* 滑动提示 */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8 text-xs text-slate-400 dark:text-slate-500">
        <span>↑ 上滑认识</span>
        <span>↓ 下滑不认识</span>
      </div>
    </div>
  );
};

export default memo(WordCard);
