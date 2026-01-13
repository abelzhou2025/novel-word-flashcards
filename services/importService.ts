import { Word, VocabularySource, Translation, Phrase } from '../types';

const CUSTOM_VOCAB_KEY = 'novelvocab-custom-vocabulary';
const CUSTOM_META_KEY = 'novelvocab-custom-meta';

export interface ImportResult {
    success: boolean;
    wordCount: number;
    errors: string[];
}

export interface CustomVocabMeta {
    filename: string;
    importedAt: number;
    wordCount: number;
}

/**
 * 解析导入的文件内容
 */
export function parseImportedFile(content: string, filename: string): ImportResult {
    const ext = filename.split('.').pop()?.toLowerCase();

    switch (ext) {
        case 'txt':
            return parseTxtFile(content);
        case 'csv':
            return parseCsvFile(content);
        case 'json':
            return parseJsonFile(content);
        default:
            return { success: false, wordCount: 0, errors: ['不支持的文件格式，请使用 TXT、CSV 或 JSON'] };
    }
}

/**
 * 解析 TXT 文件（每行一个单词）
 */
function parseTxtFile(content: string): ImportResult {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

    if (lines.length === 0) {
        return { success: false, wordCount: 0, errors: ['文件为空或没有有效单词'] };
    }

    const words: Word[] = lines.map((line, i) => {
        // 支持 "word\ttranslation" 格式（制表符分隔）
        const parts = line.split('\t');
        const word = parts[0].trim();
        const translation = parts[1]?.trim();

        return {
            id: `custom-${i}-${word}`,
            word,
            translation: translation || undefined,
            translations: translation ? [{ translation, type: '' }] : [],
            phrases: [],
            source: VocabularySource.CUSTOM,
        };
    });

    saveCustomVocabulary(words, 'imported.txt');
    return { success: true, wordCount: words.length, errors: [] };
}

/**
 * 解析 CSV 文件
 * 支持格式: word,translation 或 word,pronunciation,translation
 */
function parseCsvFile(content: string): ImportResult {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);

    if (lines.length === 0) {
        return { success: false, wordCount: 0, errors: ['CSV 文件为空'] };
    }

    // 跳过标题行（如果看起来是标题）
    const firstLine = lines[0].toLowerCase();
    const startIndex = firstLine.includes('word') ? 1 : 0;

    const words: Word[] = [];
    const errors: string[] = [];

    for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));

        if (parts.length < 1 || !parts[0]) {
            errors.push(`第 ${i + 1} 行格式错误`);
            continue;
        }

        const word = parts[0];
        const translation = parts.length === 2 ? parts[1] : parts[2];
        const pronunciation = parts.length >= 3 ? parts[1] : undefined;

        words.push({
            id: `custom-${i}-${word}`,
            word,
            pronunciation,
            translation,
            translations: translation ? [{ translation, type: '' }] : [],
            phrases: [],
            source: VocabularySource.CUSTOM,
        });
    }

    if (words.length === 0) {
        return { success: false, wordCount: 0, errors: ['没有解析到有效单词', ...errors] };
    }

    saveCustomVocabulary(words, 'imported.csv');
    return { success: true, wordCount: words.length, errors };
}

/**
 * 解析 JSON 文件
 * 支持 KyleBing 格式和简单数组格式
 */
function parseJsonFile(content: string): ImportResult {
    try {
        const data = JSON.parse(content);

        if (!Array.isArray(data)) {
            return { success: false, wordCount: 0, errors: ['JSON 必须是数组格式'] };
        }

        const words: Word[] = data.map((item: any, i: number) => {
            // KyleBing 格式
            if (item.word && item.translations) {
                return {
                    id: `custom-${i}-${item.word}`,
                    word: item.word,
                    translations: item.translations as Translation[],
                    phrases: (item.phrases || []) as Phrase[],
                    source: VocabularySource.CUSTOM,
                };
            }

            // 简单格式 { word: "...", translation: "..." }
            if (item.word) {
                return {
                    id: `custom-${i}-${item.word}`,
                    word: item.word,
                    pronunciation: item.pronunciation,
                    translation: item.translation,
                    translations: item.translation ? [{ translation: item.translation, type: '' }] : [],
                    phrases: [],
                    source: VocabularySource.CUSTOM,
                };
            }

            // 字符串数组
            if (typeof item === 'string') {
                return {
                    id: `custom-${i}-${item}`,
                    word: item,
                    translations: [],
                    phrases: [],
                    source: VocabularySource.CUSTOM,
                };
            }

            return null;
        }).filter(Boolean) as Word[];

        if (words.length === 0) {
            return { success: false, wordCount: 0, errors: ['没有解析到有效单词'] };
        }

        saveCustomVocabulary(words, 'imported.json');
        return { success: true, wordCount: words.length, errors: [] };
    } catch (err) {
        return { success: false, wordCount: 0, errors: ['JSON 解析失败: ' + (err as Error).message] };
    }
}

/**
 * 保存自定义词库到 localStorage
 */
export function saveCustomVocabulary(words: Word[], filename: string): void {
    localStorage.setItem(CUSTOM_VOCAB_KEY, JSON.stringify(words));
    localStorage.setItem(CUSTOM_META_KEY, JSON.stringify({
        filename,
        importedAt: Date.now(),
        wordCount: words.length,
    } as CustomVocabMeta));
}

/**
 * 获取自定义词库
 */
export function getCustomVocabulary(): Word[] {
    try {
        const saved = localStorage.getItem(CUSTOM_VOCAB_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (err) {
        console.error('Failed to load custom vocabulary:', err);
    }
    return [];
}

/**
 * 获取自定义词库元数据
 */
export function getCustomVocabMeta(): CustomVocabMeta | null {
    try {
        const saved = localStorage.getItem(CUSTOM_META_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (err) {
        console.error('Failed to load custom vocab meta:', err);
    }
    return null;
}

/**
 * 清除自定义词库
 */
export function clearCustomVocabulary(): void {
    localStorage.removeItem(CUSTOM_VOCAB_KEY);
    localStorage.removeItem(CUSTOM_META_KEY);
}

/**
 * 检查是否有自定义词库
 */
export function hasCustomVocabulary(): boolean {
    return localStorage.getItem(CUSTOM_VOCAB_KEY) !== null;
}
