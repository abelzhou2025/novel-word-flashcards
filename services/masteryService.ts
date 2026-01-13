import { Word, WordMastery } from '../types';

const MASTERY_KEY = 'novelvocab-mastery';

/**
 * 从 localStorage 获取掌握度数据
 */
export function getMasteryData(): Map<string, WordMastery> {
    try {
        const saved = localStorage.getItem(MASTERY_KEY);
        if (saved) {
            const parsed: [string, WordMastery][] = JSON.parse(saved);
            return new Map(parsed);
        }
    } catch (err) {
        console.error('Failed to load mastery data:', err);
    }
    return new Map();
}

/**
 * 保存掌握度数据到 localStorage
 */
export function saveMasteryData(data: Map<string, WordMastery>): void {
    try {
        const array = Array.from(data.entries());
        localStorage.setItem(MASTERY_KEY, JSON.stringify(array));
    } catch (err) {
        console.error('Failed to save mastery data:', err);
    }
}

/**
 * 更新单词掌握度
 * @param wordId 单词ID
 * @param action 'view' (查看译文), 'known' (认识), 'unknown' (不认识)
 */
export function updateMastery(
    wordId: string,
    action: 'view' | 'known' | 'unknown'
): void {
    const data = getMasteryData();
    const existing = data.get(wordId) || {
        wordId,
        viewedCount: 0,
        unknownCount: 0,
        knownCount: 0,
        lastSeen: Date.now(),
        weight: 1,
    };

    existing.lastSeen = Date.now();

    switch (action) {
        case 'view':
            existing.viewedCount += 1;
            existing.weight = Math.min(existing.weight + 2, 10); // 查看译文 +2 权重，最大10
            break;
        case 'unknown':
            existing.unknownCount += 1;
            existing.weight = Math.min(existing.weight + 3, 10); // 不认识 +3 权重
            break;
        case 'known':
            existing.knownCount += 1;
            existing.weight = Math.max(existing.weight - 1, 0); // 认识 -1 权重，最小0
            // 如果连续认识2次，权重归零（暂时移出高优先级）
            if (existing.knownCount >= 2 && existing.unknownCount === 0) {
                existing.weight = 0;
            }
            break;
    }

    data.set(wordId, existing);
    saveMasteryData(data);
}

/**
 * 加权随机选择单词
 * @param allWords 所有可选单词
 * @param count 需要选择的数量
 * @returns 选中的单词列表
 */
export function selectWordsWithWeights(
    allWords: Word[],
    count: number
): Word[] {
    const masteryData = getMasteryData();

    // 计算每个单词的权重
    const weighted = allWords.map(word => {
        const mastery = masteryData.get(word.id);
        // 默认权重为 1，有掌握度记录的使用记录的权重
        const weight = mastery ? Math.max(mastery.weight, 0.1) : 1;
        return { word, weight };
    });

    // 计算总权重
    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);

    // 加权随机选择
    const selected: Word[] = [];
    const remaining = [...weighted];

    while (selected.length < count && remaining.length > 0) {
        let random = Math.random() * remaining.reduce((s, w) => s + w.weight, 0);

        for (let i = 0; i < remaining.length; i++) {
            random -= remaining[i].weight;
            if (random <= 0) {
                selected.push(remaining[i].word);
                remaining.splice(i, 1);
                break;
            }
        }
    }

    // 打乱顺序
    return shuffleArray(selected);
}

/**
 * Fisher-Yates 洗牌算法
 */
function shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * 重置单词的掌握度
 */
export function resetMastery(wordId: string): void {
    const data = getMasteryData();
    data.delete(wordId);
    saveMasteryData(data);
}

/**
 * 清除所有掌握度数据
 */
export function clearAllMastery(): void {
    localStorage.removeItem(MASTERY_KEY);
}
