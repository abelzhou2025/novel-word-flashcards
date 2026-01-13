# 词汇闪卡系统重构实施方案

## 问题概述

根据用户需求，需要对现有的单词记忆应用进行以下改造：
1. 替换词库来源为 KyleBing/english-vocabulary 项目的分级词库
2. 改进单词卡交互体验（例句显示、模糊译文、滑动手势）
3. 实现智能的单词出现频率算法
4. 修复阅读器翻译点击无反馈问题
5. 添加自定义词库导入功能

## 已确认的词库资源

词库文件已复制到项目根目录：`english-vocabulary-master/`

### JSON 格式词库 (推荐使用)

| 文件 | 路径 | 说明 |
|------|------|------|
| 初中词汇 | `json/1-初中-顺序.json` | ~2,900 单词 |
| 高中词汇 | `json/2-高中-顺序.json` | ~4,600 单词 |
| **CET-4** | `json/3-CET4-顺序.json` | ~5,300 单词 |
| **CET-6** | `json/4-CET6-顺序.json` | ~2,900 单词 |
| 考研词汇 | `json/5-考研-顺序.json` | ~6,100 单词 |
| 托福词汇 | `json/6-托福-顺序.json` | ~6,000 单词 |
| SAT 词汇 | `json/7-SAT-顺序.json` | ~2,800 单词 |

### JSON 词库结构

```json
{
  "word": "ability",
  "translations": [{ "translation": "能力，能耐；才能", "type": "n" }],
  "phrases": [
    { "phrase": "innovation ability", "translation": "创新能力" },
    { "phrase": "learning ability", "translation": "学习能力" }
  ]
}
```

---

## 一、词库数据结构设计

### 1.1 KyleBing 词库 JSON 格式 (来源分析)

```json
{
  "word": "ability",
  "translations": [
    { "translation": "能力，能耐；才能", "type": "n" }
  ],
  "phrases": [
    { "phrase": "innovation ability", "translation": "创新能力" },
    { "phrase": "learning ability", "translation": "学习能力" }
  ]
}
```

### 1.2 新的 TypeScript 类型定义

#### [MODIFY] [types.ts](file:///Users/abel/Desktop/novel-word-flashcards1229/types.ts)

```typescript
// 词库来源枚举 (替换原 Vocabulary)
export enum VocabularySource {
  CET4 = "cet4",
  CET6 = "cet6",
  KAOYAN = "kaoyan",      // 考研词汇
  SAT = "sat",            // SAT词汇
  GRE = "gre",            // GRE词汇 (如有)
  IELTS = "ielts",        // 雅思词汇 (如有)
  TOEFL = "toefl",        // 托福词汇 (如有)
}

// 单词翻译条目
export interface Translation {
  translation: string;
  type: string;  // n/v/adj/adv 等词性
}

// 短语/例句
export interface Phrase {
  phrase: string;
  translation: string;
}

// 扩展后的单词结构
export interface Word {
  id: string;
  word: string;
  pronunciation?: string;        // 音标 (可选)
  translations: Translation[];   // 多个释义
  phrases: Phrase[];             // 短语/例句
  source: VocabularySource;      // 词库来源
}

// 单词掌握状态 (用于智能出现频率)
export interface WordMastery {
  wordId: string;
  viewedCount: number;           // 查看译文次数
  unknownCount: number;          // 标记不认识次数
  knownCount: number;            // 标记认识次数
  lastSeen: number;              // 上次出现时间戳
  weight: number;                // 出现权重 (越高越容易出现)
}

export type WordCount = 10 | 20 | 30 | 50;
```

---

## 二、词库数据文件

### 2.1 数据目录结构

```
data/
├── vocabularies/
│   ├── cet4.json       # CET4 词汇
│   ├── cet6.json       # CET6 词汇
│   ├── kaoyan.json     # 考研词汇
│   ├── sat.json        # SAT 词汇
│   └── index.ts        # 词库索引和加载器
├── dictionary.ts       # 保留 (阅读器用)
└── janeEyre.ts         # 保留 (小说阅读)
```

### 2.2 词库配置

#### [NEW] [data/vocabularies/index.ts](file:///Users/abel/Desktop/novel-word-flashcards1229/data/vocabularies/index.ts)

```typescript
import { VocabularySource, Word } from '../../types';

// 词库元数据
export interface VocabularyMeta {
  source: VocabularySource;
  name: string;           // 显示名称
  description: string;    // 描述
  wordCount: number;      // 单词数量
  attribution: string;    // 来源说明
}

export const VOCABULARY_META: Record<VocabularySource, VocabularyMeta> = {
  [VocabularySource.CET4]: {
    source: VocabularySource.CET4,
    name: "CET-4 四级词汇",
    description: "大学英语四级考试核心词汇",
    wordCount: 4500,
    attribution: "词库来源: KyleBing/english-vocabulary"
  },
  [VocabularySource.CET6]: {
    source: VocabularySource.CET6,
    name: "CET-6 六级词汇",
    description: "大学英语六级考试核心词汇",
    wordCount: 2500,
    attribution: "词库来源: KyleBing/english-vocabulary"
  },
  // ... 其他词库元数据
};

// 动态加载词库
export async function loadVocabulary(source: VocabularySource): Promise<Word[]> {
  const data = await import(`./${source}.json`);
  return data.default.map((item: any, index: number) => ({
    id: `${source}-${index}`,
    word: item.word,
    translations: item.translations || [],
    phrases: item.phrases || [],
    source,
  }));
}
```

### 2.3 数据转换脚本

#### [NEW] [scripts/convert-vocabulary.js](file:///Users/abel/Desktop/novel-word-flashcards1229/scripts/convert-vocabulary.js)

将 KyleBing 词库转换为项目所需格式的 Node.js 脚本。

---

## 三、单词卡组件改造

### 3.1 新的单词卡布局

```
┌────────────────────────────────────┐
│          ABANDON                   │  ← 单词 (大字体)
│       /əˈbændən/                   │  ← 音标 (可选)
├────────────────────────────────────┤
│  例句:                              │
│  "He had to abandon his car in     │
│   the snowstorm."                  │
│  (他不得不在暴风雪中丢弃汽车。)       │
├────────────────────────────────────┤
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← 模糊的中文释义
│  ░░ v.丢弃；放弃，抛弃 ░░░░░░░░░░░  │     点击后清晰显示
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└────────────────────────────────────┘
      ↑ 上滑 = 认识    ↓ 下滑 = 不认识
```

### 3.2 组件修改

#### [MODIFY] [components/WordCard.tsx](file:///Users/abel/Desktop/novel-word-flashcards1229/components/WordCard.tsx)

关键变更：
1. 添加 `showTranslation` state 控制释义显示
2. 添加模糊效果 CSS (blur filter)
3. 点击释义区域切换显示状态
4. 显示例句/短语
5. 回调: 当用户点击查看释义时，通知父组件更新权重

```typescript
interface WordCardProps {
  word: Word;
  onSwipe: (word: Word, direction: 'up' | 'down') => void;
  onRevealTranslation: (word: Word) => void;  // 新增: 查看释义回调
  isActive: boolean;
  zIndex: number;
}

const WordCard: React.FC<WordCardProps> = ({ word, onSwipe, onRevealTranslation, isActive, zIndex }) => {
  const [showTranslation, setShowTranslation] = useState(false);
  
  const handleReveal = () => {
    if (!showTranslation) {
      setShowTranslation(true);
      onRevealTranslation(word);  // 通知父组件
    }
  };
  
  // ... 滑动逻辑保持不变
  
  return (
    <div className="word-card" ...>
      {/* 单词 */}
      <h2 className="text-5xl font-bold">{word.word}</h2>
      
      {/* 音标 */}
      {word.pronunciation && (
        <p className="text-lg text-slate-400">{word.pronunciation}</p>
      )}
      
      {/* 例句 (取第一个短语) */}
      {word.phrases.length > 0 && (
        <div className="example-sentence">
          <p className="text-lg">{word.phrases[0].phrase}</p>
          <p className="text-sm text-slate-500">{word.phrases[0].translation}</p>
        </div>
      )}
      
      {/* 释义区域 (可模糊) */}
      <div 
        onClick={handleReveal}
        className={`translation-area ${showTranslation ? '' : 'blur-sm'} cursor-pointer`}
      >
        {word.translations.map((t, i) => (
          <p key={i}><span className="text-indigo-500">{t.type}.</span> {t.translation}</p>
        ))}
        {!showTranslation && (
          <p className="text-xs text-slate-400 mt-2">点击查看释义</p>
        )}
      </div>
    </div>
  );
};
```

---

## 四、智能出现频率算法

### 4.1 权重计算规则

| 行为 | 权重变化 |
|------|---------|
| 查看释义 | +2 |
| 下滑 (不认识) | +3 |
| 上滑 (认识) | -1 (最低为 1) |
| 连续认识 2 次 | 权重归零，暂时移出测试池 |

### 4.2 实现方案

#### [NEW] [services/masteryService.ts](file:///Users/abel/Desktop/novel-word-flashcards1229/services/masteryService.ts)

```typescript
const MASTERY_KEY = 'novelvocab-mastery';

export function getMasteryData(): Map<string, WordMastery> {
  // 从 localStorage 读取
}

export function updateMastery(
  wordId: string, 
  action: 'view' | 'known' | 'unknown'
): void {
  // 更新权重逻辑
}

export function selectWords(
  allWords: Word[], 
  count: number, 
  masteryData: Map<string, WordMastery>
): Word[] {
  // 加权随机选择算法
  // 权重高的单词更容易被选中
}
```

### 4.3 加权随机选择算法

```typescript
function selectWords(allWords: Word[], count: number, mastery: Map<string, WordMastery>): Word[] {
  // 1. 计算每个单词的选中概率
  const weighted = allWords.map(word => {
    const m = mastery.get(word.id);
    const weight = m ? m.weight : 1;  // 默认权重为 1
    return { word, weight };
  });
  
  // 2. 归一化权重
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  
  // 3. 加权随机选择
  const selected: Word[] = [];
  while (selected.length < count && weighted.length > 0) {
    let random = Math.random() * totalWeight;
    for (let i = 0; i < weighted.length; i++) {
      random -= weighted[i].weight;
      if (random <= 0) {
        selected.push(weighted[i].word);
        weighted.splice(i, 1);
        break;
      }
    }
  }
  
  return selected;
}
```

---

## 五、设置界面改造

#### [MODIFY] [components/SetupScreen.tsx](file:///Users/abel/Desktop/novel-word-flashcards1229/components/SetupScreen.tsx)

- 词库选择改为多级分类
- 显示词库来源说明
- 显示每个词库的单词总数

---

## 六、文件变更汇总

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| MODIFY | `types.ts` | 新增类型定义 |
| DELETE | `data/mockWords.ts` | 删除旧词库 |
| NEW | `data/vocabularies/*.json` | 新词库数据文件 |
| NEW | `data/vocabularies/index.ts` | 词库加载器 |
| NEW | `services/masteryService.ts` | 掌握度服务 |
| NEW | `scripts/convert-vocabulary.js` | 数据转换脚本 |
| MODIFY | `components/WordCard.tsx` | 卡片交互改造 |
| MODIFY | `components/StudyScreen.tsx` | 集成新逻辑 |
| MODIFY | `components/SetupScreen.tsx` | 词库选择改造 |
| MODIFY | `constants.ts` | 更新常量 |
| MODIFY | `App.tsx` | 集成掌握度状态 |

---

## 七、验证方案

### 7.1 手动测试

1. **词库加载测试**
   - 启动应用: `npm run dev`
   - 选择不同词库 (CET4/CET6/考研等)
   - 验证单词能正确加载，显示词库来源

2. **单词卡交互测试**
   - 验证单词和例句显示
   - 验证释义默认模糊，点击后清晰
   - 验证上滑/下滑手势正确响应

3. **智能频率测试**
   - 标记某单词"不认识" 3 次
   - 重新开始测试，验证该单词出现频率更高
   - 连续认识同一单词 2 次，验证暂时不再出现

### 7.2 构建测试

```bash
npm run build
```

确保无 TypeScript 类型错误和构建失败。

---

## 八、执行顺序建议

1. ⬜ 用户将 `english-vocabulary-master` 复制到项目目录
2. ⬜ 运行转换脚本生成 JSON 数据文件
3. ⬜ 更新 `types.ts` 类型定义
4. ⬜ 创建 `services/masteryService.ts`
5. ⬜ 创建 `data/vocabularies/index.ts`
6. ⬜ 修改 `WordCard.tsx` 组件
7. ⬜ 修改 `StudyScreen.tsx` 集成新逻辑
8. ⬜ 修改 `SetupScreen.tsx` 词库选择
9. ⬜ 修改 `App.tsx` 状态管理
10. ⬜ 删除 `data/mockWords.ts`
11. ⬜ 测试验证

---

## 九、阅读器翻译点击 Bug 修复

### 9.1 问题分析

经代码审查，`ReaderScreen.tsx` 和 `Chapter.tsx` 的点击事件处理逻辑是正确的。

**根本原因**：`data/dictionary.ts` 只包含约 **270 个单词**，覆盖率极低。大部分点击的单词在词典中找不到对应翻译，导致 `setSelectedWord(null)` 被执行，用户看不到任何反馈。

### 9.2 修复方案

1. **扩展词典数据**：将 KyleBing 词库整合为阅读器词典
2. **添加"未找到"反馈**：当词典无此单词时，显示提示而非静默失败

#### [MODIFY] [components/ReaderScreen.tsx](file:///Users/abel/Desktop/novel-word-flashcards1229/components/ReaderScreen.tsx)

```diff
  if (translation) {
    // ... 现有逻辑
  } else {
-   setSelectedWord(null);
+   // 显示未找到提示
+   const rect = (event.target as HTMLElement).getBoundingClientRect();
+   setSelectedWord({
+     word: cleanedWord,
+     translation: '(词典中暂无此单词)',
+     position: { top: rect.bottom + window.scrollY + 5, left: rect.left + rect.width / 2 },
+   });
  }
```

3. **生成完整词典**：从 KyleBing 词库导出一个大型 `dictionary.ts`

---

## 十、自定义词库导入功能

### 10.1 功能描述

用户可以上传自己的生词列表（支持 TXT/CSV/JSON 格式），导入后作为独立词库进行测试。

### 10.2 支持的格式

#### TXT 格式 (每行一个单词)
```
abandon
ability
absolute
```

#### CSV 格式
```csv
word,translation
abandon,丢弃；放弃
ability,能力；才能
```

#### JSON 格式 (兼容 KyleBing 格式)
```json
[
  { "word": "abandon", "translations": [{"type": "v", "translation": "丢弃；放弃"}] }
]
```

### 10.3 实现方案

#### [NEW] [services/importService.ts](file:///Users/abel/Desktop/novel-word-flashcards1229/services/importService.ts)

```typescript
export interface ImportResult {
  success: boolean;
  wordCount: number;
  errors: string[];
}

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
      return { success: false, wordCount: 0, errors: ['不支持的文件格式'] };
  }
}

function parseTxtFile(content: string): ImportResult {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);
  const words = lines.map((word, i) => ({
    id: `custom-${i}`,
    word,
    translations: [],  // 无翻译
    phrases: [],
    source: 'CUSTOM'
  }));
  saveCustomVocabulary(words);
  return { success: true, wordCount: words.length, errors: [] };
}
// ... CSV/JSON 解析类似
```

#### [NEW] [components/ImportVocabModal.tsx](file:///Users/abel/Desktop/novel-word-flashcards1229/components/ImportVocabModal.tsx)

文件上传模态框组件：
- 文件拖放/选择区域
- 格式说明
- 导入进度和结果反馈

#### [MODIFY] [components/SetupScreen.tsx](file:///Users/abel/Desktop/novel-word-flashcards1229/components/SetupScreen.tsx)

添加"导入自定义词库"按钮：

```tsx
<button
  onClick={() => setShowImportModal(true)}
  className="w-full bg-amber-600 text-white font-bold py-3 px-4 rounded-lg ..."
>
  📥 导入自定义词库
</button>
```

### 10.4 数据存储

自定义词库保存在 `localStorage`:
- `novelvocab-custom-vocabulary`: 用户导入的单词列表
- `novelvocab-custom-meta`: 导入时间、文件名、单词数等元数据

---

## 更新后的文件变更汇总

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| MODIFY | `types.ts` | 新增类型定义，添加 CUSTOM 词库类型 |
| DELETE | `data/mockWords.ts` | 删除旧词库 |
| NEW | `data/vocabularies/*.json` | 新词库数据文件 |
| NEW | `data/vocabularies/index.ts` | 词库加载器 |
| MODIFY | `data/dictionary.ts` | 扩展词典或替换为新格式 |
| NEW | `services/masteryService.ts` | 掌握度服务 |
| NEW | `services/importService.ts` | 词库导入解析服务 |
| NEW | `scripts/convert-vocabulary.js` | 数据转换脚本 |
| MODIFY | `components/WordCard.tsx` | 卡片交互改造 |
| MODIFY | `components/StudyScreen.tsx` | 集成新逻辑 |
| MODIFY | `components/SetupScreen.tsx` | 词库选择改造 + 导入按钮 |
| MODIFY | `components/ReaderScreen.tsx` | 修复翻译点击无反馈问题 |
| NEW | `components/ImportVocabModal.tsx` | 自定义词库导入模态框 |
| MODIFY | `constants.ts` | 更新常量 |
| MODIFY | `App.tsx` | 集成掌握度状态和自定义词库状态 |

---

## 执行顺序建议

1. ⬜ 用户将 `english-vocabulary-master` 复制到项目目录
2. ⬜ 运行转换脚本生成 JSON 数据文件
3. ⬜ 更新 `types.ts` 类型定义
4. ⬜ 创建 `services/masteryService.ts`
5. ⬜ 创建 `services/importService.ts`
6. ⬜ 创建 `data/vocabularies/index.ts`
7. ⬜ 修复 `ReaderScreen.tsx` 翻译点击问题
8. ⬜ 创建 `ImportVocabModal.tsx` 组件
9. ⬜ 修改 `WordCard.tsx` 组件
10. ⬜ 修改 `StudyScreen.tsx` 集成新逻辑
11. ⬜ 修改 `SetupScreen.tsx` 词库选择 + 导入入口
12. ⬜ 修改 `App.tsx` 状态管理
13. ⬜ 删除 `data/mockWords.ts`
14. ⬜ 测试验证

---

> **交付给 Cline 执行时注意**:
> 1. 请确保先复制词库数据
> 2. 按顺序执行，确保类型和依赖正确
> 3. 每个步骤后运行 `npm run dev` 验证无报错
