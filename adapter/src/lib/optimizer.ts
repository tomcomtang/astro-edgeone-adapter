/**
 * 文件优化模块
 */

import { existsSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Logger } from './types.js';

/**
 * 优化node_modules体积
 */
export function optimizeNodeModules(serverDir: string, logger: Logger): void {
  const nodeModulesPath = join(serverDir, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    return;
  }
  
  cleanDirectory(nodeModulesPath, logger);
}

/**
 * 递归遍历目录并删除不必要的文件
 */
function cleanDirectory(dir: string, logger: Logger): void {
  const unnecessaryPatterns = [
    /\.map$/,           // source maps
    /\.d\.ts$/,         // TypeScript 声明文件
    /\.md$/,            // Markdown 文档
    /^README/i,         // README 文件
    /^CHANGELOG/i,      // CHANGELOG 文件
    /^LICENSE/i,        // LICENSE 文件
    /\.test\./,         // 测试文件
    /\.spec\./,         // spec 文件
    /^__tests__$/,      // 测试目录
    /^tests?$/,         // test/tests 目录
    /^example/i,        // 示例目录
    /^\.git/,           // git 目录
  ];
  
  let removedCount = 0;
  
  function traverse(currentDir: string) {
    if (!existsSync(currentDir)) return;
    
    try {
      const entries = readdirSync(currentDir);
      
      for (const entry of entries) {
        const fullPath = join(currentDir, entry);
        
        try {
          const stat = statSync(fullPath);
          
          // 检查是否是不必要的文件/目录
          const shouldRemove = unnecessaryPatterns.some(pattern => pattern.test(entry));
          
          if (shouldRemove) {
            rmSync(fullPath, { recursive: true, force: true });
            removedCount++;
            continue;
          }
          
          // 递归处理子目录
          if (stat.isDirectory()) {
            traverse(fullPath);
          }
        } catch (e) {
          // 忽略单个文件的错误
        }
      }
    } catch (e) {
      // 忽略目录读取错误
    }
  }
  
  traverse(dir);
}

