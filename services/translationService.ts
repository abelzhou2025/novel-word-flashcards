// 中文翻译查询服务
// 从所有词库中查找单词的中文翻译

// 词库文件路径 - 加载所有词库
const VOCABULARY_FILES = [
    '/vocabularies/3-CET4-顺序.json',
    '/vocabularies/4-CET6-顺序.json',
    '/vocabularies/5-考研-顺序.json',
    '/vocabularies/6-托福-顺序.json',
    '/vocabularies/7-SAT-顺序.json',
    '/vocabularies/1-初中-顺序.json',
    '/vocabularies/2-高中-顺序.json',
];

// 翻译缓存
let translationCache: Map<string, string> | null = null;
let loadPromise: Promise<void> | null = null;

interface VocabEntry {
    word: string;
    translations?: { translation: string; type: string }[];
}

/**
 * 加载所有词库到缓存
 */
async function loadTranslationCache(): Promise<void> {
    if (translationCache) return;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        const cache = new Map<string, string>();

        for (const file of VOCABULARY_FILES) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const data: VocabEntry[] = await response.json();
                    for (const entry of data) {
                        if (entry.word && entry.translations && entry.translations.length > 0) {
                            // 只取第一个翻译，保持简短
                            const firstTrans = entry.translations[0];
                            const translation = firstTrans.translation.split('；')[0].split('，')[0];
                            cache.set(entry.word.toLowerCase(), translation);
                        }
                    }
                }
            } catch (err) {
                console.error(`Failed to load ${file}:`, err);
            }
        }

        translationCache = cache;
    })();

    return loadPromise;
}

/**
 * 查询单词的中文翻译（简短版）
 */
export async function getChineseTranslation(word: string): Promise<string | null> {
    await loadTranslationCache();

    if (!translationCache) return null;

    const lowerWord = word.toLowerCase();

    // 直接查找
    if (translationCache.has(lowerWord)) {
        return translationCache.get(lowerWord) || null;
    }

    // 尝试去除常见后缀
    const suffixPatterns = [
        { suffix: 'ies', replace: 'y' },      // studies -> study
        { suffix: 'ied', replace: 'y' },      // studied -> study
        { suffix: 'ying', replace: 'ie' },    // dying -> die
        { suffix: 'ves', replace: 'f' },      // lives -> life
        { suffix: 'ves', replace: 'fe' },     // wives -> wife
        { suffix: 'es', replace: '' },
        { suffix: 's', replace: '' },
        { suffix: 'ed', replace: '' },
        { suffix: 'ed', replace: 'e' },       // created -> create
        { suffix: 'ing', replace: '' },
        { suffix: 'ing', replace: 'e' },      // making -> make
        { suffix: 'ly', replace: '' },
        { suffix: 'er', replace: '' },
        { suffix: 'er', replace: 'e' },       // larger -> large
        { suffix: 'est', replace: '' },
        { suffix: 'est', replace: 'e' },      // largest -> large
        { suffix: 'ness', replace: '' },
        { suffix: 'ment', replace: '' },
        { suffix: 'tion', replace: 'te' },    // creation -> create
        { suffix: 'ation', replace: 'e' },    // creation -> create (another form)
    ];

    for (const { suffix, replace } of suffixPatterns) {
        if (lowerWord.endsWith(suffix) && lowerWord.length > suffix.length + 1) {
            const stem = lowerWord.slice(0, -suffix.length) + replace;
            if (translationCache.has(stem)) {
                return translationCache.get(stem) || null;
            }
        }
    }

    // 尝试双写辅音 (running -> run, stopped -> stop)
    if (lowerWord.endsWith('ing') && lowerWord.length > 5) {
        const base = lowerWord.slice(0, -3);
        // 尝试去掉双写辅音
        if (base.length > 1 && base[base.length - 1] === base[base.length - 2]) {
            const root = base.slice(0, -1);
            if (translationCache.has(root)) {
                return translationCache.get(root) || null;
            }
        }
    }

    if (lowerWord.endsWith('ed') && lowerWord.length > 4) {
        const base = lowerWord.slice(0, -2);
        if (base.length > 1 && base[base.length - 1] === base[base.length - 2]) {
            const root = base.slice(0, -1);
            if (translationCache.has(root)) {
                return translationCache.get(root) || null;
            }
        }
    }

    return null;
}

/**
 * 预加载翻译缓存
 */
export function preloadTranslations(): void {
    loadTranslationCache();
}
