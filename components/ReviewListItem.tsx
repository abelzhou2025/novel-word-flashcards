
import React, { useState, useRef, useEffect } from 'react';
import { Word } from '../types';

interface ReviewListItemProps {
  word: Word;
  onDelete: (wordId: string) => void;
}

const SWIPE_THRESHOLD = 40; // Swipe 40px to the right to delete

const ReviewListItem: React.FC<ReviewListItemProps> = ({ word, onDelete }) => {
  const [position, setPosition] = useState({ x: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef(0);
  const positionRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startPosRef.current;
      // Only allow swiping to the right, and not too far
      if (dx > 0) {
        positionRef.current = dx;
        setPosition({ x: dx });
      }
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);
      
      if (itemRef.current) {
        itemRef.current.style.transition = 'transform 0.3s ease-out';
      }

      if (positionRef.current > SWIPE_THRESHOLD) {
        // Animate out and then delete
        if (itemRef.current) {
          itemRef.current.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
          itemRef.current.style.transform = `translateX(100%)`;
          itemRef.current.style.opacity = '0';
          setTimeout(() => {
            onDelete(word.id);
          }, 300); // Match transition duration
        }
      } else {
        // Animate back to original position
        positionRef.current = 0;
        setPosition({ x: 0 });
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
  }, [isDragging, word.id, onDelete]);

  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    startPosRef.current = clientX;
    positionRef.current = 0;
    setPosition({ x: 0 });
    if (itemRef.current) {
      itemRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (clientX: number) => {
    if (!isDragging) return;
    const dx = clientX - startPosRef.current;
    if (dx > 0) {
      positionRef.current = dx;
      setPosition({ x: dx });
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (itemRef.current) {
      itemRef.current.style.transition = 'transform 0.3s ease-out';
    }

    if (positionRef.current > SWIPE_THRESHOLD) {
      if (itemRef.current) {
        itemRef.current.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        itemRef.current.style.transform = `translateX(100%)`;
        itemRef.current.style.opacity = '0';
        setTimeout(() => {
          onDelete(word.id);
        }, 300);
      }
    } else {
      positionRef.current = 0;
      setPosition({ x: 0 });
    }
  };

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleDragStart(e.touches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleTouchMove(e.touches[0].clientX);
  };
  
  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleTouchEnd();
  };
  
  const itemStyle = {
    transform: `translateX(${position.x}px)`,
    touchAction: 'pan-y', // Prioritize vertical scroll over horizontal swipe
  };

  const backgroundOpacity = Math.min(position.x / SWIPE_THRESHOLD, 1);

  return (
    <div className="relative rounded-lg overflow-hidden bg-red-500">
      <div 
        className="absolute inset-0 flex items-center justify-start px-6 text-white"
        style={{ opacity: backgroundOpacity, zIndex: 0 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>
      <div
        ref={itemRef}
        className="relative flex justify-between items-center text-md p-3 bg-slate-50 dark:bg-slate-700 cursor-grab"
        style={itemStyle}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <span className="font-semibold text-slate-800 dark:text-slate-200">{word.word}</span>
        <span className="font-chinese text-slate-500 dark:text-slate-400 text-right truncate pl-4">{word.translation}</span>
      </div>
    </div>
  );
};

export default ReviewListItem;
