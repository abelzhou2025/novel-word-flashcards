import { VocabularySource, WordCount } from './types';

// 可用词库列表（兼容旧代码）
export const VOCABULARIES: VocabularySource[] = [
    VocabularySource.CET4,
    VocabularySource.CET6,
    VocabularySource.KAOYAN,
    VocabularySource.TOEFL,
    VocabularySource.SAT,
    VocabularySource.JUNIOR,
    VocabularySource.SENIOR,
];

// 每次学习的单词数量选项
export const WORD_COUNTS: WordCount[] = [10, 20, 30, 50];

// LocalStorage 键
export const STORAGE_KEYS = {
    DIFFICULT_WORDS: 'novelvocab-difficult-words',
    READER_WORDS: 'novelvocab-reader-words',
    STUDIED_WORDS: 'novelvocab-studied-words',
    MASTERY_DATA: 'novelvocab-mastery',
    CUSTOM_VOCABULARY: 'novelvocab-custom-vocabulary',
    CUSTOM_META: 'novelvocab-custom-meta',
    READER_FONT_SIZE: 'novelvocab-reader-font-size',
};