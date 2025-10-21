# EdgeOne 部署指南

## ⚠️ 重要：跨平台依赖问题

EdgeOne 运行在 **Linux** 环境，但本地开发可能是 **macOS** 或 **Windows**。Sharp 等 native 模块的二进制文件是平台相关的，必须使用正确的平台版本。

## 🚀 部署方法

### 方法 1：使用 Docker（推荐）✅

这是最可靠的方法，确保依赖与 EdgeOne Linux 环境完全匹配。

```bash
# 1. 构建项目
npm run build

# 2. 使用 Docker 安装 Linux 依赖
cd .edgeone/server-handler
docker run --rm \
  -v "$(pwd):/app" \
  -w /app \
  node:20-alpine \
  sh -c "npm install --omit=dev"

# 3. 返回项目根目录
cd ../..

# 4. 部署 .edgeone 目录到 EdgeOne
```

### 方法 2：使用准备脚本

我们提供了自动化脚本：

```bash
# 1. 构建项目
npm run build

# 2. 运行部署准备脚本
./scripts/prepare-edgeone-deploy.sh

# 3. 部署 .edgeone 目录到 EdgeOne
```

### 方法 3：在 Linux 环境下构建

如果你有 Linux 服务器或 CI/CD：

```bash
# 在 Linux 环境下
npm run build

# 依赖自动匹配 Linux 平台
# 直接部署 .edgeone 目录
```

### 方法 4：手动替换 Sharp（不推荐）

```bash
# 1. 构建项目
npm run build

# 2. 进入 server-handler
cd .edgeone/server-handler

# 3. 移除 macOS Sharp
rm -rf node_modules/@img/sharp-darwin-*
rm -rf node_modules/sharp

# 4. 安装 Linux Sharp
npm install --platform=linux --arch=x64 sharp

cd ../..
```

## 📦 目录结构

部署到 EdgeOne 的目录结构：

```
.edgeone/
├── assets/              # 静态资源（CDN）
├── server-handler/      # 服务端函数
│   ├── node_modules/    # ✅ 必须包含 Linux 平台依赖
│   ├── package.json
│   ├── index.mjs
│   └── ...
├── meta.json
└── project.json
```

## 🐛 常见问题

### 1. "Process exited unexpectedly"

**原因**: 
- 缺少 node_modules
- 或者使用了错误平台的 Sharp 绑定

**解决**: 
- 使用 Docker 重新安装依赖（方法 1）
- 检查 node_modules/@img/ 下的 Sharp 版本

### 2. "MissingSharp" 错误

**原因**: Sharp 的 native 绑定不存在或不兼容

**解决**: 
```bash
cd .edgeone/server-handler
docker run --rm -v "$(pwd):/app" -w /app node:20-alpine npm install sharp --omit=dev
```

### 3. 图片优化返回 403/404

**状态**: ✅ 已在适配器中修复

如果仍有问题：
- 检查 EdgeOne 日志
- 查看 `[EdgeOne Entry]` 日志
- 确认 Sharp 已正确安装

## 🔍 验证部署

部署后，检查：

1. **主页**: `https://your-domain.edgeone.run/`
   - 应该正常显示

2. **图片优化**: `https://your-domain.edgeone.run/_image?href=%2F_astro%2Fblog-placeholder-1.Bx0Zcyzv.jpg&w=100&h=100&f=webp`
   - 应该返回优化后的 WebP 图片

3. **EdgeOne 日志**:
   - 查找 `[EdgeOne Entry]` 日志
   - 检查是否有错误信息

## 📊 部署清单

- [ ] 运行 `npm run build`
- [ ] 使用 Docker 安装 Linux 依赖
- [ ] 验证 `.edgeone/server-handler/node_modules/@img/` 包含 `sharp-linux-x64`
- [ ] 确认 `node_modules` 大小合理（约 15-20MB）
- [ ] 部署到 EdgeOne
- [ ] 测试主页和图片优化

## 🎯 GitHub Actions 自动化（可选）

如果使用 GitHub Actions 部署：

```yaml
name: Deploy to EdgeOne

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest  # ← Linux 环境，依赖自动匹配
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run build  # ← 在 Linux 上构建，依赖自动正确
      
      - name: Deploy to EdgeOne
        run: |
          # 你的 EdgeOne 部署命令
```

## 📚 相关文档

- [Sharp 跨平台安装](https://sharp.pixelplumbing.com/install#cross-platform)
- [EdgeOne Pages 文档](https://cloud.tencent.com/document/product/1552)
- [Astro 部署指南](https://docs.astro.build/en/guides/deploy/)

---

**构建时间**: 自动生成  
**适配器版本**: @edgeone/astro-adapter  
**Node.js 版本**: >= 18.17.0

