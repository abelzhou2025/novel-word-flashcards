
import React, { useState, useRef, useEffect, memo } from 'react';
import { Word } from '../types';

interface WordCardProps {
  word: Word;
  onSwipe: (word: Word, direction: 'up' | 'down') => void;
  isActive: boolean;
  zIndex: number;
}

const SWIPE_THRESHOLD_Y = 60;

const WordCard: React.FC<WordCardProps> = ({ word, onSwipe, isActive, zIndex }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  
  const opacity = 1 - Math.abs(position.y) / 250;

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
  
  useEffect(() => {
    positionRef.current = { x: 0, y: 0 };
     setPosition({ x: 0, y: 0 });
  }, [word]);

  const dynamicStyle = {
    transform: `translate(${position.x}px, ${position.y}px) scale(${isActive ? 1 : 0.95})`,
    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    opacity: isActive ? opacity : 1,
    zIndex: zIndex,
    top: isActive ? 0 : `${(3-zIndex) * -10}px`,
    touchAction: 'none' as const,
  };

  let borderColorClass = 'border-transparent';
  if (isDragging) {
    if (position.y > SWIPE_THRESHOLD_Y * 0.7) {
      borderColorClass = 'border-red-500';
    } else if (position.y < -SWIPE_THRESHOLD_Y * 0.7) {
      borderColorClass = 'border-green-500';
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
      <h2 className="text-5xl font-bold text-slate-800 dark:text-white mb-2">{word.word}</h2>
      <p className="text-xl text-slate-500 dark:text-slate-400 mb-8">{word.pronunciation}</p>
      <p className="text-xl text-indigo-600 dark:text-indigo-400 font-medium font-chinese px-2">{word.translation}</p>
    </div>
  );
};

export default memo(WordCard);
