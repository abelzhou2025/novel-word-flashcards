import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { VocabularySource, VocabularySourceLabels, Word, WordCount } from '../types';
import { WORD_COUNTS } from '../constants';
import { loadVocabulary, VOCABULARY_META } from '../data/vocabularies';
import { selectWordsWithWeights } from '../services/masteryService';
import { hasCustomVocabulary, getCustomVocabMeta } from '../services/importService';
import ImportVocabModal from './ImportVocabModal';

// 可用的词库列表
const AVAILABLE_SOURCES: VocabularySource[] = [
  VocabularySource.CET4,
  VocabularySource.CET6,
  VocabularySource.KAOYAN,
  VocabularySource.TOEFL,
  VocabularySource.SAT,
  VocabularySource.JUNIOR,
  VocabularySource.SENIOR,
  VocabularySource.CUSTOM,
];

interface SetupScreenProps {
  onStart: (vocabulary: VocabularySource, words: Word[]) => void;
  isLoading: boolean;
  onLoading: (loading: boolean) => void;
  onError: (error: string) => void;
  error: string | null;
  onGoToReview: () => void;
  onGoToReader: () => void;
  onGoToReaderVocab: () => void;
  hasDifficultWords: boolean;
  hasReaderWords: boolean;
  studiedWordIds: string[];
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStart, isLoading, onLoading, onError, error, onGoToReview, onGoToReader, onGoToReaderVocab, hasDifficultWords, hasReaderWords, studiedWordIds }) => {
  const [selectedVocabulary, setSelectedVocabulary] = useState<VocabularySource>(VocabularySource.CET4);
  const [selectedCount, setSelectedCount] = useState<WordCount>(20);
  const [showImportModal, setShowImportModal] = useState(false);
  const [customVocabCount, setCustomVocabCount] = useState(0);
  const [vocabWordCount, setVocabWordCount] = useState<number | null>(null);

  // 检查自定义词库状态
  useEffect(() => {
    if (hasCustomVocabulary()) {
      const meta = getCustomVocabMeta();
      setCustomVocabCount(meta?.wordCount || 0);
    }
  }, [showImportModal]);

  // 加载当前词库的单词数
  useEffect(() => {
    const loadCount = async () => {
      if (selectedVocabulary === VocabularySource.CUSTOM) {
        setVocabWordCount(customVocabCount);
      } else {
        const meta = VOCABULARY_META[selectedVocabulary];
        setVocabWordCount(meta?.wordCount || 0);
      }
    };
    loadCount();
  }, [selectedVocabulary, customVocabCount]);

  const handleGenerate = useCallback(async () => {
    onLoading(true);
    onError('');
    try {
      // 检查自定义词库是否存在
      if (selectedVocabulary === VocabularySource.CUSTOM && !hasCustomVocabulary()) {
        throw new Error('请先导入自定义词库');
      }

      // 加载词库
      const allWords = await loadVocabulary(selectedVocabulary);

      if (allWords.length === 0) {
        throw new Error('该词库暂无数据');
      }

      // 过滤已学习的单词（如果需要）
      const studiedSet = new Set(studiedWordIds);
      const unstudiedWords = allWords.filter(w => !studiedSet.has(w.id));

      // 如果未学习的单词不足，使用全部单词
      const wordsPool = unstudiedWords.length >= selectedCount ? unstudiedWords : allWords;

      // 使用加权随机选择
      const words = selectWordsWithWeights(wordsPool, selectedCount);

      if (words.length === 0) {
        throw new Error('无法生成单词列表');
      }

      onStart(selectedVocabulary, words);
    } catch (err) {
      if (err instanceof Error) {
        onError(err.message);
      } else {
        onError('发生未知错误');
      }
    } finally {
      onLoading(false);
    }
  }, [selectedVocabulary, selectedCount, onStart, onLoading, onError, studiedWordIds]);

  const handleImportSuccess = useCallback((wordCount: number) => {
    setCustomVocabCount(wordCount);
    setSelectedVocabulary(VocabularySource.CUSTOM);
  }, []);

  // 计算已学习数量
  const studiedWordsInCat = useMemo(() => {
    // 简化计算，只基于 studiedWordIds 的前缀匹配
    const prefix = selectedVocabulary + '-';
    return studiedWordIds.filter(id => id.startsWith(prefix)).length;
  }, [selectedVocabulary, studiedWordIds]);

  return (
    <>
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg w-full max-w-sm mx-auto animate-fade-in">
        <div className="space-y-6">
          <div>
            <label htmlFor="vocab-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              选择词库
            </label>
            <select
              id="vocab-select"
              value={selectedVocabulary}
              onChange={(e) => setSelectedVocabulary(e.target.value as VocabularySource)}
              disabled={isLoading}
              className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
            >
              {AVAILABLE_SOURCES.map((source) => {
                const isCustom = source === VocabularySource.CUSTOM;
                const hasCustom = hasCustomVocabulary();
                const label = VocabularySourceLabels[source];
                const count = isCustom ? customVocabCount : VOCABULARY_META[source]?.wordCount || 0;

                return (
                  <option
                    key={source}
                    value={source}
                    disabled={isCustom && !hasCustom}
                  >
                    {label} ({count} 词){isCustom && !hasCustom ? ' - 未导入' : ''}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              词库来源: KyleBing/english-vocabulary
            </p>
          </div>

          <div>
            <label htmlFor="count-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              每次学习单词数
            </label>
            <select
              id="count-select"
              value={selectedCount}
              onChange={(e) => setSelectedCount(Number(e.target.value) as WordCount)}
              disabled={isLoading}
              className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
            >
              {WORD_COUNTS.map((count) => (
                <option key={count} value={count}>
                  {count} 个单词
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>本分类: 已学习 {studiedWordsInCat} / {vocabWordCount || '...'} 词</p>
        </div>

        {error && (
          <div className="mt-4 text-center text-red-500 bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-3">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-transform transform hover:scale-105 disabled:bg-indigo-400 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                加载中...
              </>
            ) : (
              '开始学习'
            )}
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            disabled={isLoading}
            className="w-full bg-amber-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-500/50 transition disabled:opacity-50"
          >
            导入自定义词库
          </button>

          {hasDifficultWords && (
            <button
              onClick={onGoToReview}
              disabled={isLoading}
              className="w-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-4 focus:ring-slate-500/50 transition disabled:opacity-50"
            >
              复习困难单词
            </button>
          )}
          {hasReaderWords && (
            <button
              onClick={onGoToReaderVocab}
              disabled={isLoading}
              className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/50 transition disabled:opacity-50"
            >
              阅读器生词本
            </button>
          )}
          <button
            onClick={onGoToReader}
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 transition disabled:opacity-50"
          >
            阅读《简·爱》
          </button>
        </div>
      </div>

      <ImportVocabModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={handleImportSuccess}
      />
    </>
  );
};

export default SetupScreen;
