import { Word, VocabularySource, VocabularyMeta, Translation, Phrase } from '../../types';

/**
 * 词库文件路径映射
 */
const VOCABULARY_FILES: Record<VocabularySource, string | null> = {
    [VocabularySource.JUNIOR]: '/vocabularies/1-初中-顺序.json',
    [VocabularySource.SENIOR]: '/vocabularies/2-高中-顺序.json',
    [VocabularySource.CET4]: '/vocabularies/3-CET4-顺序.json',
    [VocabularySource.CET6]: '/vocabularies/4-CET6-顺序.json',
    [VocabularySource.KAOYAN]: '/vocabularies/5-考研-顺序.json',
    [VocabularySource.TOEFL]: '/vocabularies/6-托福-顺序.json',
    [VocabularySource.SAT]: '/vocabularies/7-SAT-顺序.json',
    [VocabularySource.CUSTOM]: null, // 自定义词库从 localStorage 读取
};

/**
 * 词库元数据
 */
export const VOCABULARY_META: Record<VocabularySource, VocabularyMeta> = {
    [VocabularySource.JUNIOR]: {
        source: VocabularySource.JUNIOR,
        name: "初中词汇",
        description: "初中英语核心词汇",
        wordCount: 2900,
        attribution: "词库来源: KyleBing/english-vocabulary"
    },
    [VocabularySource.SENIOR]: {
        source: VocabularySource.SENIOR,
        name: "高中词汇",
        description: "高中英语核心词汇",
        wordCount: 4600,
        attribution: "词库来源: KyleBing/english-vocabulary"
    },
    [VocabularySource.CET4]: {
        source: VocabularySource.CET4,
        name: "CET-4 四级",
        description: "大学英语四级考试核心词汇",
        wordCount: 5300,
        attribution: "词库来源: KyleBing/english-vocabulary"
    },
    [VocabularySource.CET6]: {
        source: VocabularySource.CET6,
        name: "CET-6 六级",
        description: "大学英语六级考试核心词汇",
        wordCount: 2900,
        attribution: "词库来源: KyleBing/english-vocabulary"
    },
    [VocabularySource.KAOYAN]: {
        source: VocabularySource.KAOYAN,
        name: "考研词汇",
        description: "研究生入学考试核心词汇",
        wordCount: 6100,
        attribution: "词库来源: KyleBing/english-vocabulary"
    },
    [VocabularySource.TOEFL]: {
        source: VocabularySource.TOEFL,
        name: "托福词汇",
        description: "托福考试核心词汇",
        wordCount: 6000,
        attribution: "词库来源: KyleBing/english-vocabulary"
    },
    [VocabularySource.SAT]: {
        source: VocabularySource.SAT,
        name: "SAT 词汇",
        description: "SAT 考试核心词汇",
        wordCount: 2800,
        attribution: "词库来源: KyleBing/english-vocabulary"
    },
    [VocabularySource.CUSTOM]: {
        source: VocabularySource.CUSTOM,
        name: "自定义词库",
        description: "用户导入的自定义词库",
        wordCount: 0,
        attribution: "用户自定义"
    },
};

// 词库缓存
const vocabularyCache: Map<VocabularySource, Word[]> = new Map();

/**
 * 加载词库数据
 */
export async function loadVocabulary(source: VocabularySource): Promise<Word[]> {
    // 检查缓存
    if (vocabularyCache.has(source)) {
        return vocabularyCache.get(source)!;
    }

    // 自定义词库从 localStorage 读取
    if (source === VocabularySource.CUSTOM) {
        const { getCustomVocabulary } = await import('../../services/importService');
        return getCustomVocabulary();
    }

    const filePath = VOCABULARY_FILES[source];
    if (!filePath) {
        console.error(`No vocabulary file for source: ${source}`);
        return [];
    }

    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 转换为 Word 格式
        const words: Word[] = data.map((item: any, index: number) => ({
            id: `${source}-${index}-${item.word}`,
            word: item.word,
            translations: item.translations as Translation[] || [],
            phrases: item.phrases as Phrase[] || [],
            source,
        }));

        // 存入缓存
        vocabularyCache.set(source, words);

        // 更新元数据中的实际单词数
        VOCABULARY_META[source].wordCount = words.length;

        return words;
    } catch (error) {
        console.error(`Failed to load vocabulary ${source}:`, error);
        return [];
    }
}

/**
 * 获取所有可用词库列表
 */
export function getAvailableVocabularies(): VocabularyMeta[] {
    return Object.values(VOCABULARY_META);
}

/**
 * 清除词库缓存
 */
export function clearVocabularyCache(): void {
    vocabularyCache.clear();
}

/**
 * 预加载常用词库
 */
export async function preloadVocabularies(): Promise<void> {
    const commonSources = [VocabularySource.CET4, VocabularySource.CET6];
    await Promise.all(commonSources.map(source => loadVocabulary(source)));
}
