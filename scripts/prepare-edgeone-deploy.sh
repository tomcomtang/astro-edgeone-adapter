#!/bin/bash

# EdgeOne 部署准备脚本
# 用于在部署前安装 Linux 平台的 Sharp

set -e

echo "🚀 Preparing EdgeOne deployment..."

# 检查 .edgeone 目录是否存在
if [ ! -d ".edgeone/server-handler" ]; then
  echo "❌ Error: .edgeone/server-handler not found. Run 'npm run build' first."
  exit 1
fi

cd .edgeone/server-handler

echo "📦 Installing Linux platform dependencies..."

# 使用 Docker 在 Linux 环境中安装 Sharp
# 或者使用 npm 的 platform 参数强制安装 Linux 版本

if command -v docker &> /dev/null; then
  echo "🐳 Using Docker to install Linux dependencies..."
  
  # 使用 Node.js Linux 镜像安装依赖
  docker run --rm \
    -v "$(pwd):/app" \
    -w /app \
    node:20-alpine \
    sh -c "npm install --platform=linux --arch=x64 --omit=dev"
  
  echo "✅ Linux dependencies installed via Docker"
else
  echo "⚠️  Docker not found, attempting direct install with platform override..."
  
  # 尝试使用 npm 的 platform 参数（可能不完全有效）
  npm install --platform=linux --arch=x64 --omit=dev
  
  echo "⚠️  Note: For best results, use Docker or build on a Linux machine"
fi

echo "✅ EdgeOne deployment ready!"
echo ""
echo "📋 Next steps:"
echo "  1. Compress .edgeone directory: tar -czf edgeone-deploy.tar.gz .edgeone/"
echo "  2. Upload to EdgeOne Pages"
echo "  3. Deploy!"

