# Novel Word Flashcards

一个帮助用户记忆单词的闪卡应用，支持指定词汇列表学习，以及阅读英文小说并收集生词。

## 功能特性

- 📚 **词汇学习**：支持 CET-4 和 CET-6 词汇列表
- 📖 **小说阅读**：在线阅读《简·爱》，点击单词查看翻译
- 💾 **生词收集**：自动收集阅读中的生词到生词簿
- 🔄 **复习模式**：针对困难单词的循环复习
- 📊 **学习统计**：跟踪学习进度和已学单词

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS

## 本地开发

**前置要求：** Node.js

1. 安装依赖：
   ```bash
   npm install
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

3. 构建生产版本：
   ```bash
   npm run build
   ```

## 部署

本项目可以部署到 Netlify、Vercel 等静态网站托管平台。

### Netlify 部署

1. 将代码推送到 GitHub
2. 在 Netlify 中导入项目
3. 构建命令：`npm run build`
4. 发布目录：`dist`

项目已包含 `netlify.toml` 配置文件，可以直接部署。

## 项目结构

```
├── components/          # React 组件
├── data/               # 词汇数据、字典、小说文本
├── services/           # 业务逻辑服务
├── scripts/            # 数据处理脚本
└── types.ts           # TypeScript 类型定义
```

## 数据说明

- **词汇库**：包含 CET-4 和 CET-6 词汇（约 6000+ 单词）
- **翻译字典**：本地存储的单词翻译字典
- **小说文本**：《简·爱》完整文本（38 章）

所有数据均为本地存储，无需 API，完全免费使用。

## 许可证

MIT License
