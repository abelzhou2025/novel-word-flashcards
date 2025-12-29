# 部署指南

## GitHub 上传步骤

### 1. 在 GitHub 创建新仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角的 "+" 按钮，选择 "New repository"
3. 输入仓库名称（例如：`novel-word-flashcards`）
4. 选择 Public 或 Private
5. **不要**勾选 "Initialize this repository with a README"（因为我们已经有了代码）
6. 点击 "Create repository"

### 2. 将本地代码推送到 GitHub

在终端中执行以下命令（将 `YOUR_USERNAME` 和 `YOUR_REPO_NAME` 替换为你的实际值）：

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 重命名分支为 main（如果当前是 master）
git branch -M main

# 推送到 GitHub
git push -u origin main
```

如果使用 SSH（推荐）：

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Netlify 部署步骤

### 方法 1：通过 GitHub 自动部署（推荐）

1. 登录 [Netlify](https://app.netlify.com)
2. 点击 "Add new site" -> "Import an existing project"
3. 选择 "GitHub" 并授权
4. 选择你的仓库 `novel-word-flashcards`
5. 配置构建设置（通常会自动检测）：
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. 点击 "Deploy site"

Netlify 会自动从 `netlify.toml` 读取配置，所以通常不需要手动设置。

### 方法 2：通过 Netlify CLI

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录 Netlify
netlify login

# 部署（首次部署）
netlify deploy

# 生产部署
netlify deploy --prod
```

### 方法 3：拖拽部署

1. 在项目根目录运行构建命令：
   ```bash
   npm run build
   ```

2. 登录 Netlify，点击 "Add new site" -> "Deploy manually"

3. 将 `dist` 文件夹拖拽到 Netlify 界面

## 部署后配置

### 环境变量

本项目不需要任何环境变量（所有数据都是本地的）。

### 自定义域名

在 Netlify 的站点设置中可以配置自定义域名。

### 自动部署

一旦连接 GitHub，Netlify 会在每次推送到 main 分支时自动重新部署。

## 故障排除

### 构建失败

- 确保 `package.json` 中的构建脚本正确
- 检查 Node.js 版本（推荐 16+）
- 查看 Netlify 构建日志获取详细错误信息

### 路由问题

如果使用客户端路由，需要在 `netlify.toml` 中添加重定向规则：

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

本项目使用 Vite，通常不需要额外配置。

