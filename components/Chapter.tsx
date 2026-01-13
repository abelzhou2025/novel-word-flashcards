import React, { useMemo } from 'react';

interface ChapterProps {
  text: string;
  onWordClick: (word: string, event: React.MouseEvent<HTMLSpanElement>) => void;
  fontSize: number; // 字号像素值
}

const Chapter: React.FC<ChapterProps> = ({ text, onWordClick, fontSize }) => {
  // Memoize paragraph processing to avoid recreating on every render
  const paragraphs = useMemo(() => {
    return text
      .split(/\n\s*\n/)  // Split by paragraph breaks (double newlines)
      .map(p => p.trim())
      .filter(p => p !== '')
      .map(paragraph => {
        // Replace single newlines within paragraph with spaces to fix broken sentences
        const normalizedParagraph = paragraph.replace(/\n+/g, ' ');
        // Split by spaces, but preserve multiple spaces as single space
        const words = normalizedParagraph.split(/\s+/).filter(w => w !== '');
        return { paragraph, words };
      });
  }, [text]);

  return (
    <div className="space-y-4">
      {paragraphs.map(({ words }, pIndex) => (
        <p key={pIndex} className="text-slate-700 dark:text-slate-300 leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
          {words.map((word, wIndex) => (
            <span
              key={`${pIndex}-${wIndex}-${word.substring(0, 10)}`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onWordClick(word, e);
              }}
              className="cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded"
            >
              {word}{' '}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
};

export default Chapter;
