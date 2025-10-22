/**
 * Native 包安装模块
 * 
 * 处理需要平台特定二进制文件的 npm 包（如 Sharp）
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Logger } from './types.js';

// 需要特殊处理的 native 包列表
const NATIVE_PACKAGES: string[] = [];

/**
 * 检查并安装 Linux 版本的 Sharp
 * 步骤2：检测是否依赖 Sharp 包，如果是则安装 Linux 版本
 */
export async function checkAndInstallLinuxSharp(
  serverDir: string,
  packageNames: Set<string>,
  logger: Logger
): Promise<void> {
  // 1. 检查是否依赖 Sharp 包
  if (!packageNames.has('sharp')) {
    logger.info('Sharp not detected in dependencies, skipping Linux Sharp installation');
    return;
  }
  
  logger.info('Sharp detected in dependencies, checking Linux version...');
  
  const nodeModulesDir = join(serverDir, 'node_modules');
  mkdirSync(nodeModulesDir, { recursive: true });
  
  const imgDir = join(nodeModulesDir, '@img');
  const linuxSharpPath = join(imgDir, 'sharp-linux-x64');
  
  // 2. 检查是否已有 Linux 版本的 Sharp
  if (existsSync(linuxSharpPath)) {
    logger.info('✓ Linux Sharp already exists');
    return;
  }
  
  logger.info('Linux Sharp not found, installing...');
  
  try {
    // 3. 删除现有的 Sharp 包（如果有）
    const sharpCorePath = join(nodeModulesDir, 'sharp');
    if (existsSync(sharpCorePath)) {
      rmSync(sharpCorePath, { recursive: true, force: true });
    }
    
    if (existsSync(imgDir)) {
      rmSync(imgDir, { recursive: true, force: true });
    }
    
    // 4. 安装 Linux 版本的 Sharp
    logger.info('Installing Linux Sharp with platform-specific flags...');
    execSync(
      'npm install sharp@0.34.3 --cpu=x64 --os=linux --libc=glibc --omit=dev --no-save --loglevel=error',
      {
        cwd: serverDir,
        stdio: 'pipe',
        env: {
          ...process.env,
          npm_config_platform: 'linux',
          npm_config_arch: 'x64',
          npm_config_target_platform: 'linux',
          npm_config_target_arch: 'x64'
        }
      }
    );
    
    // 5. 验证安装结果
    if (existsSync(linuxSharpPath)) {
      logger.info('✓ Linux Sharp installed successfully');
    } else {
      logger.warn('⚠️  Linux Sharp installation completed but bindings not found');
    }
  } catch (error) {
    logger.error(`Failed to install Linux Sharp: ${error}`);
    throw error;
  }
}

