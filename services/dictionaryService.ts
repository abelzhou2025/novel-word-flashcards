// Free Dictionary API Service
// https://dictionaryapi.dev/

export interface DictionaryEntry {
    word: string;
    phonetic?: string;
    meanings: {
        partOfSpeech: string;
        definitions: {
            definition: string;
            example?: string;
            synonyms?: string[];
        }[];
        synonyms?: string[];
    }[];
}

// 缓存已查询的单词
const definitionCache = new Map<string, DictionaryEntry | null>();

/**
 * 从 Free Dictionary API 获取英文定义
 */
export async function fetchEnglishDefinition(word: string): Promise<DictionaryEntry | null> {
    const lowerWord = word.toLowerCase();

    // 检查缓存
    if (definitionCache.has(lowerWord)) {
        return definitionCache.get(lowerWord) || null;
    }

    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${lowerWord}`);

        if (!response.ok) {
            definitionCache.set(lowerWord, null);
            return null;
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            const entry = data[0] as DictionaryEntry;
            definitionCache.set(lowerWord, entry);
            return entry;
        }

        definitionCache.set(lowerWord, null);
        return null;
    } catch (error) {
        console.error('Failed to fetch definition:', error);
        definitionCache.set(lowerWord, null);
        return null;
    }
}

/**
 * 获取简短的英文定义
 */
export function getShortDefinition(entry: DictionaryEntry): string {
    const firstMeaning = entry.meanings[0];
    if (firstMeaning && firstMeaning.definitions[0]) {
        return firstMeaning.definitions[0].definition;
    }
    return '';
}

/**
 * 获取同义词
 */
export function getSynonyms(entry: DictionaryEntry): string[] {
    const synonyms: string[] = [];

    for (const meaning of entry.meanings) {
        if (meaning.synonyms) {
            synonyms.push(...meaning.synonyms);
        }
        for (const def of meaning.definitions) {
            if (def.synonyms) {
                synonyms.push(...def.synonyms);
            }
        }
    }

    // 去重并限制数量
    return [...new Set(synonyms)].slice(0, 5);
}

/**
 * 获取例句
 */
export function getExampleSentence(entry: DictionaryEntry): string | null {
    for (const meaning of entry.meanings) {
        for (const def of meaning.definitions) {
            if (def.example) {
                return def.example;
            }
        }
    }
    return null;
}
