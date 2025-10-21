/**
 * 清理输出目录模块
 */

import { existsSync, readdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Logger } from './types.js';

/**
 * 清理输出目录，但保留指定文件
 * @param outputDir 输出目录路径
 * @param preserveFiles 要保留的文件列表
 * @param logger 日志对象
 */
export function cleanOutputDirectory(
  outputDir: string,
  preserveFiles: string[] = ['project.json'],
  logger: Logger
): void {
  if (!existsSync(outputDir)) {
    return;
  }

  logger.info('Cleaning output directory...');

  // 保存需要保留的文件内容
  const preservedContents = new Map<string, string>();
  
  for (const file of preserveFiles) {
    const filePath = join(outputDir, file);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        preservedContents.set(file, content);
        logger.info(`Preserving ${file}`);
      } catch (e) {
        logger.warn(`Failed to read ${file}: ${e}`);
      }
    }
  }

  // 删除目录下的所有内容
  try {
    const entries = readdirSync(outputDir);
    for (const entry of entries) {
      const entryPath = join(outputDir, entry);
      try {
        rmSync(entryPath, { recursive: true, force: true });
      } catch (e) {
        logger.warn(`Failed to remove ${entry}: ${e}`);
      }
    }
  } catch (e) {
    logger.warn(`Failed to clean directory: ${e}`);
  }

  // 恢复保留的文件
  for (const [file, content] of preservedContents) {
    const filePath = join(outputDir, file);
    try {
      writeFileSync(filePath, content);
      logger.info(`Restored ${file}`);
    } catch (e) {
      logger.warn(`Failed to restore ${file}: ${e}`);
    }
  }
}

