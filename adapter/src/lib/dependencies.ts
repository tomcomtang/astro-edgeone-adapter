/**
 * 依赖分析和拷贝模块
 */

import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { nodeFileTrace } from '@vercel/nft';
import { globSync } from 'tinyglobby';
import type { Logger } from './types.js';

/**
 * 使用 @vercel/nft 分析依赖并返回包名集合和文件列表
 * @param cache - NFT 缓存对象，用于优化重复分析（可选）
 */
export async function analyzeDependencies(
  rootDir: string,
  serverDir: string,
  serverEntryFile: string,
  logger: Logger,
  cache?: any
): Promise<{ packageNames: Set<string>; fileList: Set<string> }> {
  const entryFile = join(serverDir, serverEntryFile);
  const renderersFile = join(serverDir, 'renderers.mjs');
  
  if (!existsSync(entryFile)) {
    logger.warn(`${serverEntryFile} not found, skipping dependency analysis`);
    return { packageNames: new Set(), fileList: new Set() };
  }
  
  try {
    // 使用 NFT 分析依赖
    const filesToAnalyze = [entryFile];
    if (existsSync(renderersFile)) {
      filesToAnalyze.push(renderersFile);
    }
    
    // 添加 pages/ 目录下的所有 .mjs 入口文件
    const pagesDir = join(serverDir, 'pages');
    if (existsSync(pagesDir)) {
      const addPageFiles = (dir: string) => {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            addPageFiles(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.mjs')) {
            filesToAnalyze.push(fullPath);
          }
        }
      };
      addPageFiles(pagesDir);
    }
    
    const { fileList, warnings } = await nodeFileTrace(filesToAnalyze, {
      base: rootDir,
      processCwd: rootDir,
      ts: true,
      mixedModules: true,
      ...(cache && { cache }), // 如果提供了缓存对象则使用
    });
    
    // 处理 warnings
    for (const warning of warnings) {
      if (warning.message.startsWith("Failed to resolve dependency")) {
        const match = /Cannot find module '(.+?)' loaded from (.+)/.exec(warning.message);
        if (match) {
          const [, module, file] = match;
          // 忽略 Astro 内部模块的解析错误
          if (module === "@astrojs/") {
            continue;
          }
          // 其他模块解析失败记录为警告
          logger.warn(`Module "${module}" couldn't be resolved from "${file}"`);
        }
      } else if (warning.message.startsWith("Failed to parse")) {
        // 跳过解析错误
        continue;
      } else {
        // 其他警告记录为警告
        logger.warn(`NFT warning: ${warning.message}`);
      }
    }
    
    const packageNames = new Set<string>();
    
    // 提取包名（不拷贝文件）
    for (const file of fileList) {
      if (file.startsWith('node_modules/')) {
        const parts = file.split('/');
        if (parts[1].startsWith('@')) {
          // scoped package: @scope/name
          if (parts.length >= 3) {
            packageNames.add(`${parts[1]}/${parts[2]}`);
          }
        } else {
          // regular package: name
          packageNames.add(parts[1]);
        }
      }
    }
    
    return { packageNames, fileList: new Set(fileList) };
  } catch (error) {
    logger.error(`Failed to analyze dependencies: ${error}`);
    return { packageNames: new Set(['astro']), fileList: new Set() };
  }
}

/**
 * 拷贝依赖包
 */
export async function copyDependencies(
  rootDir: string,
  serverDir: string,
  fileList: Set<string>,
  logger: Logger,
  includeFiles: string[] = [],
  excludeFiles: string[] = []
): Promise<void> {
  const copiedFiles = new Set<string>();
  let fileCount = 0;
  
  for (const file of fileList) {
    const sourcePath = join(rootDir, file);
    const targetPath = join(serverDir, file);
    
    // 跳过已经在 server-handler 目录中的文件
    if (sourcePath.startsWith(serverDir)) {
      continue;
    }
    
    // 只处理 node_modules 和 package.json 文件
    if (!file.startsWith('node_modules/') && !file.endsWith('package.json')) {
      continue;
    }
    
    // 应用 excludeFiles 模式
    if (excludeFiles.length > 0) {
      const shouldExclude = excludeFiles.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
        return regex.test(file);
      });
      if (shouldExclude) {
        continue;
      }
    }
    
    if (existsSync(sourcePath) && !copiedFiles.has(file)) {
      try {
        mkdirSync(dirname(targetPath), { recursive: true });
        cpSync(sourcePath, targetPath, { force: true });
        copiedFiles.add(file);
        fileCount++;
      } catch (e) {
        // 忽略单个文件拷贝失败
      }
    }
  }
  
  // 处理 includeFiles - 强制包含指定的文件（从项目根目录）
  if (includeFiles.length > 0) {
    const additionalFiles = new Set<string>();
    
    // 使用 glob 查找匹配的文件
    for (const pattern of includeFiles) {
      try {
        const matched = globSync(pattern, { cwd: rootDir, absolute: false });
        matched.forEach(file => additionalFiles.add(file));
      } catch (e) {
        logger.warn(`Failed to match pattern "${pattern}": ${e}`);
      }
    }
    
    // 复制额外的文件
    for (const file of additionalFiles) {
      if (!copiedFiles.has(file)) {
        const sourcePath = join(rootDir, file);
        const targetPath = join(serverDir, file);
        
        if (existsSync(sourcePath)) {
          try {
            mkdirSync(dirname(targetPath), { recursive: true });
            cpSync(sourcePath, targetPath, { force: true });
            copiedFiles.add(file);
            fileCount++;
          } catch (e) {
            logger.warn(`Failed to copy ${file}: ${e}`);
          }
        }
      }
    }
  }
}

