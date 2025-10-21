/**
 * 依赖分析和拷贝模块
 */

import { cpSync, existsSync, mkdirSync, readdirSync, linkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { nodeFileTrace } from '@vercel/nft';
import type { Logger } from './types.js';

/**
 * 使用 @vercel/nft 分析并拷贝依赖到server-handler目录
 */
export async function copyDependencies(
  rootDir: string,
  serverDir: string,
  logger: Logger
): Promise<void> {
  logger.info('Analyzing dependencies with @vercel/nft...');
  
  const entryFile = join(serverDir, 'entry.mjs');
  
  if (!existsSync(entryFile)) {
    logger.warn('entry.mjs not found, skipping dependency analysis');
    return;
  }
  
  try {
    // 使用 NFT 分析依赖
    const { fileList } = await nodeFileTrace([entryFile], {
      base: rootDir,
      processCwd: rootDir,
      ts: true,
      mixedModules: true,
    });
    
    const copiedFiles = new Set<string>();
    let fileCount = 0;
    
    // 拷贝所有分析出的文件
    for (const file of fileList) {
      const sourcePath = join(rootDir, file);
      const targetPath = join(serverDir, file);
      
      // 跳过已经存在于 server-handler 的文件
      if (sourcePath.startsWith(serverDir)) {
        continue;
      }
      
      // 跳过非 node_modules 的文件（除了必要的配置文件）
      if (!file.startsWith('node_modules/') && !file.endsWith('package.json')) {
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
    
    logger.info(`Copied ${fileCount} files analyzed by @vercel/nft`);
    
    // 修复 Sharp 的 native 绑定链接问题
    fixSharpBindings(serverDir, logger);
  } catch (error) {
    logger.error(`Failed to analyze dependencies: ${error}`);
    logger.warn('Falling back to manual dependency copying...');
    
    // 失败时回退到简单的依赖拷贝
    fallbackCopyDependencies(rootDir, serverDir, logger);
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

