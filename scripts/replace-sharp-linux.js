#!/usr/bin/env node

/**
 * 替换 Sharp 为 Linux 版本
 * 
 * Vercel 在部署时会重新安装依赖，所以 macOS Sharp 会被替换为 Linux Sharp
 * EdgeOne 不会重新安装，所以我们需要手动替换
 * 
 * 用法：
 *   npm run build
 *   node scripts/replace-sharp-linux.js
 */

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const serverHandlerDir = join(rootDir, '.edgeone', 'server-handler');

console.log('🔄 Replacing Sharp with Linux version...\n');

// 检查 server-handler 是否存在
if (!existsSync(serverHandlerDir)) {
  console.error('❌ Error: .edgeone/server-handler not found');
  console.error('   Please run "npm run build" first\n');
  process.exit(1);
}

try {
  // 进入 server-handler 目录
  process.chdir(serverHandlerDir);
  
  console.log('📦 Current directory:', process.cwd());
  console.log('');
  
  // 删除 macOS Sharp 绑定
  console.log('🗑️  Removing macOS Sharp bindings...');
  const imgDir = join(serverHandlerDir, 'node_modules', '@img');
  
  if (existsSync(imgDir)) {
    const darwinDirs = [
      'sharp-darwin-arm64',
      'sharp-darwin-x64',
      'sharp-libvips-darwin-arm64',
      'sharp-libvips-darwin-x64',
      'sharp-win32-ia32',
      'sharp-win32-x64'
    ];
    
    for (const dir of darwinDirs) {
      const dirPath = join(imgDir, dir);
      if (existsSync(dirPath)) {
        console.log(`   - Removing ${dir}`);
        rmSync(dirPath, { recursive: true, force: true });
      }
    }
  }
  
  // 删除 Sharp 核心包（会触发重新安装）
  const sharpDir = join(serverHandlerDir, 'node_modules', 'sharp');
  if (existsSync(sharpDir)) {
    console.log('   - Removing sharp core package');
    rmSync(sharpDir, { recursive: true, force: true });
  }
  
  console.log('');
  console.log('📥 Installing Linux Sharp (this may take a moment)...');
  
  // 安装 Linux 版本的 Sharp
  // 使用 --cpu 和 --os 参数指定平台
  try {
    execSync(
      'npm install sharp@0.34.3 --cpu=x64 --os=linux --libc=glibc --omit=dev --no-save',
      { 
        stdio: 'inherit',
        env: {
          ...process.env,
          npm_config_platform: 'linux',
          npm_config_arch: 'x64'
        }
      }
    );
    console.log('');
    console.log('✅ Successfully installed Linux Sharp!');
  } catch (error) {
    console.error('\n❌ Failed to install Linux Sharp');
    console.error('   Trying alternative method...\n');
    
    // 备用方法：直接安装特定平台包
    try {
      execSync(
        'npm install @img/sharp-linux-x64@0.34.4 @img/sharp-libvips-linux-x64@1.2.3 --omit=dev --no-save',
        { stdio: 'inherit' }
      );
      execSync(
        'npm install sharp@0.34.3 --omit=dev --no-save --ignore-scripts',
        { stdio: 'inherit' }
      );
      console.log('');
      console.log('✅ Successfully installed Linux Sharp (alternative method)!');
    } catch (altError) {
      console.error('\n❌ Both methods failed');
      console.error('   You may need to use Docker or build on Linux\n');
      process.exit(1);
    }
  }
  
  // 验证安装
  console.log('');
  console.log('🔍 Verifying installation...');
  
  const linuxSharpDir = join(serverHandlerDir, 'node_modules', '@img', 'sharp-linux-x64');
  if (existsSync(linuxSharpDir)) {
    console.log('   ✅ Linux Sharp bindings found');
    
    // 显示文件信息
    execSync('ls -lh node_modules/@img/ | grep sharp', { stdio: 'inherit' });
  } else {
    console.error('   ⚠️  Linux Sharp bindings not found');
    console.error('   Deployment may fail on EdgeOne');
  }
  
  console.log('');
  console.log('🎉 Done! You can now deploy to EdgeOne');
  console.log('');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

