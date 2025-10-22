/**
 * EdgeOne Astro Adapter
 * 
 * 用于将 Astro 项目部署到 EdgeOne Pages 的适配器
 */

import type { AstroAdapter, AstroIntegration, AstroConfig } from 'astro';
import { fileURLToPath } from 'node:url';
import { cpSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { 
  PACKAGE_NAME, 
  ASSETS_DIR, 
  SERVER_HANDLER_DIR 
} from './lib/constants.js';
import { analyzeDependencies, copyDependenciesExcludingSharp } from './lib/dependencies.js';
import { checkAndInstallLinuxSharp } from './lib/native-packages.js';
import { createSimpleServerPackageJson, createMetaConfig } from './lib/config.js';
import { optimizeNodeModules } from './lib/optimizer.js';
import { createServerEntryFile } from './lib/server-entry.js';
import { cleanOutputDirectory } from './lib/clean.js';
import type { EdgeOneAdapterOptions } from './lib/types.js';

/**
 * 获取适配器配置
 */
function getAdapter(): AstroAdapter {
  const serverEntrypoint = fileURLToPath(new URL('./server.ts', import.meta.url));
  
  return {
    name: PACKAGE_NAME,
    serverEntrypoint,
    exports: ['default'],
    supportedAstroFeatures: {
      hybridOutput: 'stable',
      staticOutput: 'stable',
      serverOutput: 'stable',
      sharpImageService: 'stable',
      i18nDomains: 'experimental',
      envGetSecret: 'stable',
    },
  };
}

/**
 * EdgeOne 适配器主函数
 */
export default function edgeoneAdapter(
  options: EdgeOneAdapterOptions = {}
): AstroIntegration {
  const { outDir = '.edgeone' } = options;
  
  // 保存配置信息
  let _config: AstroConfig;
  let _buildOutput: 'static' | 'server' | 'hybrid';

  return {
    name: PACKAGE_NAME,
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          build: {
            format: 'directory',
            redirects: false,
          },
          vite: {
            ssr: {
              external: ['node:async_hooks'],
            },
          },
        });
      },

      'astro:config:done': ({ setAdapter, config, buildOutput }) => {
        _config = config;
        _buildOutput = buildOutput;
        setAdapter(getAdapter());
      },

      'astro:build:start': ({ logger }) => {
        // 在构建开始时清理输出目录，但保留 project.json
        const edgeoneDir = fileURLToPath(new URL(`./${outDir}/`, _config.root));
        cleanOutputDirectory(edgeoneDir, ['project.json'], logger);
      },

      'astro:build:done': async ({ dir, routes, logger }) => {
        const edgeoneDir = fileURLToPath(new URL(`./${outDir}/`, _config.root));
        const staticDir = fileURLToPath(new URL(`./${outDir}/${ASSETS_DIR}/`, _config.root));
        const serverDir = fileURLToPath(new URL(`./${outDir}/${SERVER_HANDLER_DIR}/`, _config.root));

        // 创建输出目录
        mkdirSync(edgeoneDir, { recursive: true });
        mkdirSync(staticDir, { recursive: true });
        
        if (_buildOutput === 'server' || _buildOutput === 'hybrid') {
          mkdirSync(serverDir, { recursive: true });
        }

        // 复制静态文件
        const sourceStaticDir = _buildOutput === 'static' 
          ? _config.outDir 
          : _config.build.client;
        
        cpSync(fileURLToPath(sourceStaticDir), staticDir, {
          recursive: true,
          force: true,
        });

        // 处理服务端文件
        if (_buildOutput === 'server' || _buildOutput === 'hybrid') {
          const sourceServerDir = _config.build.server;
          cpSync(fileURLToPath(sourceServerDir), serverDir, {
            recursive: true,
            force: true,
          });
          
          const rootDir = fileURLToPath(_config.root);
          
          // 按照要求的4个步骤处理依赖
          logger.info('Starting dependency processing with 4 steps...');
          
          // 步骤1：@vercel/nft 分析构建结果的包依赖
          logger.info('Step 1: Analyzing dependencies with @vercel/nft...');
          const { packageNames, fileList } = await analyzeDependencies(rootDir, serverDir, logger);
          logger.info(`Found ${packageNames.size} package dependencies`);
          
          // 步骤2：检测是否依赖 Sharp 包，如果是则安装 Linux 版本
          logger.info('Step 2: Checking and installing Linux Sharp if needed...');
          await checkAndInstallLinuxSharp(serverDir, packageNames, logger);
          
          // 步骤3：确保 Linux Sharp 安装后，只写入 type: module
          logger.info('Step 3: Creating simplified package.json (type: module only)...');
          createSimpleServerPackageJson(serverDir);
          
          // 步骤4：拷贝除 Sharp 外的其他依赖包
          logger.info('Step 4: Copying dependencies (excluding Sharp)...');
          await copyDependenciesExcludingSharp(rootDir, serverDir, fileList, logger);
          
          logger.info('✅ All 4 dependency processing steps completed!');
          
          logger.info('Optimizing node_modules size...');
          optimizeNodeModules(serverDir, logger);
          
          logger.info('Creating server entry index.mjs...');
          createServerEntryFile(serverDir);
        }

        // 生成路由配置文件
        logger.info('Generating meta.json...');
        createMetaConfig(routes, edgeoneDir);

        logger.info(`Copying static files to ${outDir}/${ASSETS_DIR}/`);
        if (_buildOutput === 'server' || _buildOutput === 'hybrid') {
          logger.info(`Copying server files to ${outDir}/${SERVER_HANDLER_DIR}/`);
        }
        logger.info(`Build complete! Ready to deploy to EdgeOne Pages.`);
      },
    },
  };
}
