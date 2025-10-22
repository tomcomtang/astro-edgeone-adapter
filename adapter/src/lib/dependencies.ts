/**
 * 依赖分析和拷贝模块
 */

import { cpSync, existsSync, mkdirSync, readdirSync, linkSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { nodeFileTrace } from '@vercel/nft';
import type { Logger } from './types.js';

/**
 * 使用 @vercel/nft 分析依赖并返回包名集合和文件列表
 */
export async function analyzeDependencies(
  rootDir: string,
  serverDir: string,
  logger: Logger
): Promise<{ packageNames: Set<string>; fileList: Set<string> }> {
  logger.info('Analyzing dependencies with @vercel/nft...');
  
  const entryFile = join(serverDir, 'entry.mjs');
  const renderersFile = join(serverDir, 'renderers.mjs');
  
  if (!existsSync(entryFile)) {
    logger.warn('entry.mjs not found, skipping dependency analysis');
    return { packageNames: new Set(), fileList: new Set() };
  }
  
  try {
    // 使用 NFT 分析依赖
    const filesToAnalyze = [entryFile];
    if (existsSync(renderersFile)) {
      filesToAnalyze.push(renderersFile);
      logger.info('Including renderers.mjs in dependency analysis');
    }
    
    const { fileList } = await nodeFileTrace(filesToAnalyze, {
      base: rootDir,
      processCwd: rootDir,
      ts: true,
      mixedModules: true,
    });
    
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
    
    logger.info(`Extracted ${packageNames.size} package dependencies`);
    
    return { packageNames, fileList: new Set(fileList) };
  } catch (error) {
    logger.error(`Failed to analyze dependencies: ${error}`);
    return { packageNames: new Set(['astro']), fileList: new Set() };
  }
}

/**
 * 拷贝非 native 的依赖包
 * 如果 skipNativePackages 为空，则拷贝所有包（用于 fallback）
 */
export async function copyNonNativeDependencies(
  rootDir: string,
  serverDir: string,
  fileList: Set<string>,
  skipNativePackages: Set<string>,
  logger: Logger
): Promise<void> {
  const shouldSkipNative = skipNativePackages.size > 0;
  
  if (shouldSkipNative) {
    logger.info('Copying non-native dependencies...');
  } else {
    logger.info('Copying all dependencies (including native packages)...');
  }
  
  const copiedFiles = new Set<string>();
  let fileCount = 0;
  
  for (const file of fileList) {
    const sourcePath = join(rootDir, file);
    const targetPath = join(serverDir, file);
    
    // 跳过已经存在于 server-handler 的文件
    if (sourcePath.startsWith(serverDir)) {
      continue;
    }
    
    // 跳过非 node_modules 的文件
    if (!file.startsWith('node_modules/') && !file.endsWith('package.json')) {
      continue;
    }
    
    // 检查是否需要跳过 native 包
    if (shouldSkipNative) {
      let isNativePackage = false;
      for (const nativePkg of skipNativePackages) {
        if (file.startsWith(`node_modules/${nativePkg}/`) || 
            file.startsWith(`node_modules/@img/sharp-`)) {
          isNativePackage = true;
          break;
        }
      }
      
      if (isNativePackage) {
        continue; // 跳过 native 包
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
  
  logger.info(`Copied ${fileCount} dependency files`);
  
  // 如果拷贝了 native 包，修复绑定
  if (!shouldSkipNative) {
    fixSharpBindings(serverDir, logger);
  }
}

/**
 * 修复 Sharp 的 native 绑定
 * Sharp 的 package.json exports 字段映射 './sharp.node' 到 './lib/sharp-<platform>.node'
 * 但某些环境下这个映射可能不工作，所以我们手动创建符号链接或复制文件
 */
function fixSharpBindings(serverDir: string, logger: Logger): void {
  try {
    const serverNodeModules = join(serverDir, 'node_modules', '@img');
    
    if (!existsSync(serverNodeModules)) {
      return;
    }
    
    const sharpDirs = readdirSync(serverNodeModules).filter((dir: string) => 
      dir.startsWith('sharp-') && !dir.includes('libvips')
    );
    
    for (const sharpDir of sharpDirs) {
      const sharpPath = join(serverNodeModules, sharpDir);
      const libDir = join(sharpPath, 'lib');
      
      if (!existsSync(libDir)) continue;
      
      // 查找 .node 文件
      const nodeFiles = readdirSync(libDir).filter((f: string) => f.endsWith('.node'));
      
      for (const nodeFile of nodeFiles) {
        const sourcePath = join(libDir, nodeFile);
        const targetPath = join(sharpPath, 'sharp.node');
        
        // 如果 sharp.node 不存在，创建硬链接或复制
        if (!existsSync(targetPath)) {
          try {
            // 尝试创建硬链接（更高效）
            linkSync(sourcePath, targetPath);
            logger.info(`Created hard link for ${sharpDir}/sharp.node`);
          } catch {
            // 如果硬链接失败，则复制文件
            cpSync(sourcePath, targetPath);
            logger.info(`Copied ${sharpDir}/sharp.node`);
          }
        }
      }
    }
  } catch (error) {
    logger.warn(`Failed to fix sharp bindings: ${error}`);
  }
}

/**
 * 备用的简单依赖拷贝方法
 */
function fallbackCopyDependencies(
  rootDir: string,
  serverDir: string,
  logger: Logger
): void {
  const essentialPackages = ['astro'];
  const serverNodeModules = join(serverDir, 'node_modules');
  mkdirSync(serverNodeModules, { recursive: true });
  
  for (const pkg of essentialPackages) {
    const sourcePath = join(rootDir, 'node_modules', pkg);
    const targetPath = join(serverNodeModules, pkg);
    
    if (existsSync(sourcePath)) {
      try {
        mkdirSync(dirname(targetPath), { recursive: true });
        cpSync(sourcePath, targetPath, { recursive: true, force: true });
      } catch (e) {
        logger.warn(`Failed to copy ${pkg}: ${e}`);
      }
    }
  }
}

/**
 * 拷贝依赖包（排除 Sharp）
 * 步骤4：拷贝除 Sharp 外的其他依赖包
 */
export async function copyDependenciesExcludingSharp(
  rootDir: string,
  serverDir: string,
  fileList: Set<string>,
  logger: Logger
): Promise<void> {
  logger.info('Copying dependencies (excluding Sharp)...');
  
  const copiedFiles = new Set<string>();
  let fileCount = 0;
  let skippedSharpCount = 0;
  
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
    
    // 跳过 Sharp 相关包
    if (file.startsWith('node_modules/sharp/') ||
        file.startsWith('node_modules/@img/sharp-') ||
        file.startsWith('node_modules/@img/colour/')) {
      skippedSharpCount++;
      continue;
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
  
  logger.info(`Copied ${fileCount} dependency files (excluding Sharp)`);
  logger.info(`Skipped ${skippedSharpCount} Sharp-related files`);
}

