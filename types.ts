/**
 * 词库来源枚举
 */
export enum VocabularySource {
  JUNIOR = "junior",     // 初中
  SENIOR = "senior",     // 高中
  CET4 = "cet4",         // 大学英语四级
  CET6 = "cet6",         // 大学英语六级
  KAOYAN = "kaoyan",     // 考研
  TOEFL = "toefl",       // 托福
  SAT = "sat",           // SAT
  CUSTOM = "custom",     // 用户自定义
}

/**
 * 词库来源显示名称
 */
export const VocabularySourceLabels: Record<VocabularySource, string> = {
  [VocabularySource.JUNIOR]: "初中词汇",
  [VocabularySource.SENIOR]: "高中词汇",
  [VocabularySource.CET4]: "CET-4 四级",
  [VocabularySource.CET6]: "CET-6 六级",
  [VocabularySource.KAOYAN]: "考研词汇",
  [VocabularySource.TOEFL]: "托福词汇",
  [VocabularySource.SAT]: "SAT 词汇",
  [VocabularySource.CUSTOM]: "自定义词库",
};

// 兼容旧代码
export const Vocabulary = VocabularySource;
export type Vocabulary = VocabularySource;

export type WordCount = 10 | 20 | 30 | 50;

/**
 * 单词翻译条目
 */
export interface Translation {
  translation: string;
  type: string;  // 词性: n/v/adj/adv 等
}

/**
 * 短语/例句
 */
export interface Phrase {
  phrase: string;
  translation: string;
}

/**
 * 扩展后的单词结构
 */
export interface Word {
  id: string;
  word: string;
  pronunciation?: string;        // 音标（可选）
  translation?: string;          // 简单翻译（兼容旧格式）
  translations?: Translation[];  // 详细翻译列表
  phrases?: Phrase[];            // 短语/例句
  source?: VocabularySource;     // 词库来源
}

/**
 * 困难单词记录
 */
export interface DifficultWordEntry {
  word: Word;
  knownCount: number;
}

/**
 * 单词掌握度状态（用于智能出现频率）
 */
export interface WordMastery {
  wordId: string;
  viewedCount: number;           // 查看译文次数
  unknownCount: number;          // 标记不认识次数
  knownCount: number;            // 标记认识次数
  lastSeen: number;              // 上次出现时间戳
  weight: number;                // 出现权重（越高越容易出现）
}

/**
 * 词库元数据
 */
export interface VocabularyMeta {
  source: VocabularySource;
  name: string;
  description: string;
  wordCount: number;
  attribution: string;
}