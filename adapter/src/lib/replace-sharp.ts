/**
 * Sharp 平台替换模块
 * 
 * 将 macOS Sharp 替换为 Linux Sharp，以便在 EdgeOne 上运行
 * 参考 Vercel 的做法：本地构建包含 macOS Sharp，部署时在 Linux 服务器重新安装
 */

import { execSync } from 'child_process';
import { existsSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Logger } from './types.js';

/**
 * 替换 Sharp 为 Linux 版本
 */
export async function replaceSharpWithLinux(
  serverDir: string,
  logger: Logger
): Promise<void> {
  logger.info('Replacing Sharp with Linux version for EdgeOne...');
  
  const nodeModulesDir = join(serverDir, 'node_modules');
  const imgDir = join(nodeModulesDir, '@img');
  
  // 检查 node_modules 是否存在
  if (!existsSync(nodeModulesDir)) {
    logger.warn('node_modules not found, skipping Sharp replacement');
    return;
  }
  
  try {
    // 1. 删除非 Linux 平台的 Sharp 绑定
    logger.info('Removing non-Linux Sharp bindings...');
    
    if (existsSync(imgDir)) {
      const platformsToRemove = [
        'sharp-darwin-arm64',
        'sharp-darwin-x64',
        'sharp-libvips-darwin-arm64',
        'sharp-libvips-darwin-x64',
        'sharp-win32-ia32',
        'sharp-win32-x64',
        'sharp-wasm32'
      ];
      
      let removedCount = 0;
      for (const platform of platformsToRemove) {
        const platformPath = join(imgDir, platform);
        if (existsSync(platformPath)) {
          rmSync(platformPath, { recursive: true, force: true });
          removedCount++;
        }
      }
      
      if (removedCount > 0) {
        logger.info(`Removed ${removedCount} non-Linux Sharp binding(s)`);
      }
    }
    
    // 删除 Sharp 核心包（触发重新安装）
    const sharpCorePath = join(nodeModulesDir, 'sharp');
    if (existsSync(sharpCorePath)) {
      rmSync(sharpCorePath, { recursive: true, force: true });
      logger.info('Removed Sharp core package');
    }
    
    // 2. 安装 Linux 版本的 Sharp
    logger.info('Installing Linux Sharp (this may take a moment)...');
    
    try {
      // 尝试方法 1：使用 npm 参数指定平台
      execSync(
        'npm install sharp@0.34.3 --cpu=x64 --os=linux --libc=glibc --omit=dev --no-save --loglevel=error',
        {
          cwd: serverDir,
          stdio: 'pipe',
          env: {
            ...process.env,
            npm_config_platform: 'linux',
            npm_config_arch: 'x64'
          }
        }
      );
      
      logger.info('Successfully installed Linux Sharp');
    } catch (error) {
      // 尝试方法 2：直接安装特定平台包
      logger.warn('Primary installation failed, trying alternative method...');
      
      try {
        execSync(
          'npm install @img/sharp-linux-x64@0.34.4 @img/sharp-libvips-linux-x64@1.2.3 --omit=dev --no-save --loglevel=error',
          { cwd: serverDir, stdio: 'pipe' }
        );
        execSync(
          'npm install sharp@0.34.3 --omit=dev --no-save --ignore-scripts --loglevel=error',
          { cwd: serverDir, stdio: 'pipe' }
        );
        
        logger.info('Successfully installed Linux Sharp (alternative method)');
      } catch (altError) {
        logger.error('Failed to install Linux Sharp');
        logger.error('Deployment to EdgeOne may fail');
        throw altError;
      }
    }
    
    // 3. 验证安装
    const linuxSharpPath = join(imgDir, 'sharp-linux-x64');
    if (existsSync(linuxSharpPath)) {
      logger.info('✓ Linux Sharp bindings verified');
      
      // 列出已安装的 Sharp 平台
      if (existsSync(imgDir)) {
        const sharpDirs = readdirSync(imgDir)
          .filter(dir => dir.startsWith('sharp-'))
          .join(', ');
        
        if (sharpDirs) {
          logger.info(`Installed Sharp platforms: ${sharpDirs}`);
        }
      }
    } else {
      logger.warn('Linux Sharp bindings not found after installation');
      logger.warn('Deployment may fail on EdgeOne');
    }
    
  } catch (error) {
    logger.error(`Error replacing Sharp: ${error}`);
    logger.warn('Continuing with existing Sharp bindings (may not work on EdgeOne)');
  }
}

