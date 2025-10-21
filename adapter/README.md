# EdgeOne Astro Adapter

这是一个用于将 Astro 项目部署到 EdgeOne Pages 的适配器。

## 📁 项目结构

```
adapter/
├── package.json          # 包配置
├── tsconfig.json         # TypeScript 配置
├── README.md             # 文档
└── src/                  # 源代码目录
    ├── index.ts          # 主入口
    ├── server.ts         # 服务端实现
    └── lib/              # 功能模块
        ├── constants.ts
        ├── types.ts
        ├── dependencies.ts
        ├── optimizer.ts
        ├── config.ts
        ├── server-entry.ts
        └── index.ts
```

## 功能

- ✅ 支持 SSR (Server-Side Rendering)
- ✅ 支持静态站点生成 (SSG)
- ✅ 支持混合模式 (Hybrid)
- ✅ 构建输出到 `.edgeone` 目录
- ✅ 使用 `@vercel/nft` 智能分析依赖（减少 81% 体积）
- ✅ 生成精简的 package.json
- ✅ 自动优化代码体积
- ✅ 自动生成服务器入口文件（监听端口 9000）
- ✅ 准备好部署到 EdgeOne Pages

## 使用方法

在 `astro.config.mjs` 中引入并配置适配器：

```javascript
import { defineConfig } from "astro/config";
import edgeone from "./adapter/index.ts";

export default defineConfig({
  output: "server", // 或 'hybrid' 或 'static'
  adapter: edgeone({
    outDir: ".edgeone", // 可选，默认为 '.edgeone'
  }),
});
```

## 构建

运行构建命令：

```bash
npm run build
```

构建结果将输出到 `.edgeone` 目录：

```
.edgeone/
├── assets/           # 静态资源
├── server-handler/   # 服务端代码
│   ├── node_modules/ # 必要的依赖包
│   ├── package.json  # 精简的依赖配置
│   └── ...           # 服务端入口和资源
└── meta.json         # 路由配置信息
```

## 优化功能

适配器会自动执行以下优化：

1. **智能依赖分析**: 使用 `@vercel/nft` (Node File Trace) 静态分析代码

   - 只拷贝运行时真正需要的文件
   - 相比传统方法减少 **81%** 的体积（从 90MB 降到 17MB）
   - 支持动态 require/import 分析
   - 自动处理 native 模块和二进制文件

2. **精简配置**: 生成最小化的 `package.json`，只包含必要的依赖

3. **体积优化**: 自动删除不必要的文件：

   - Source maps (`.map` 文件)
   - TypeScript 声明文件 (`.d.ts`)
   - 文档文件 (README, CHANGELOG, LICENSE)
   - 测试文件和目录
   - 示例代码

4. **服务器入口**: 自动生成 `index.mjs` 启动文件
   - 监听端口 9000
   - 支持流式响应
   - 完整的错误处理
   - Web Crypto API polyfill

### 性能对比

| 指标       | 传统方法 | @vercel/nft | 优化效果 |
| ---------- | -------- | ----------- | -------- |
| 依赖体积   | 90MB     | 17MB        | ↓ 81%    |
| 拷贝文件数 | 290 个包 | 141 个文件  | ↓ 51%    |
| 需删除文件 | 2951 个  | 1 个        | ↓ 99.97% |

## 本地测试

构建完成后，可以在本地启动服务器测试：

```bash
cd .edgeone/server-handler
node index.mjs
```

服务器将在 `http://localhost:9000` 启动。

## 部署到 EdgeOne Pages

构建完成后，将 `.edgeone` 目录的内容部署到 EdgeOne Pages 即可。
