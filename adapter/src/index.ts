/**
 * EdgeOne Astro Adapter
 * 
 * 用于将 Astro 项目部署到 EdgeOne Pages 的适配器
 */

import type { AstroAdapter, AstroIntegration, AstroConfig } from 'astro';
import { fileURLToPath } from 'node:url';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { globSync } from 'tinyglobby';
import { 
  PACKAGE_NAME, 
  ASSETS_DIR, 
  SERVER_HANDLER_DIR 
} from './lib/constants.js';
import { analyzeDependencies, copyDependencies } from './lib/dependencies.js';
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
      i18nDomains: 'experimental',
      envGetSecret: 'stable',
      sharpImageService: 'stable',
    },
  };
}

/**
 * EdgeOne 适配器主函数
 */
export default function edgeoneAdapter(
  options: EdgeOneAdapterOptions = {}
): AstroIntegration {
  const { outDir = '.edgeone', includeFiles = [], excludeFiles = [] } = options;
  
  // 保存配置信息
  let _config: AstroConfig;
  let _buildOutput: 'static' | 'server';
  
  // NFT 缓存对象（在适配器级别创建，每次构建都使用新的空对象）
  let _nftCache: any = {};

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

      'astro:config:done': ({ setAdapter, config, buildOutput, logger }) => {
        _config = config;
        _buildOutput = buildOutput;
        setAdapter(getAdapter());
      },

      'astro:build:start': ({ logger }) => {
        // 每次构建开始时重置 NFT 缓存
        _nftCache = {};
        
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
        
        if (_buildOutput === 'server') {
          mkdirSync(serverDir, { recursive: true });
        }

        // 复制静态文件
        // static 模式下从 dist/client 复制
        // server 模式下从 dist/client 复制
        const sourceStaticDir = _buildOutput === 'static' 
          ? new URL('client/', _config.outDir)  // dist/client
          : _config.build.client;
        
        cpSync(fileURLToPath(sourceStaticDir), staticDir, {
          recursive: true,
          force: true,
        });

        // 处理服务端文件
        if (_buildOutput === 'server') {
          const sourceServerDir = _config.build.server;
          cpSync(fileURLToPath(sourceServerDir), serverDir, {
            recursive: true,
            force: true,
          });
          
          const rootDir = fileURLToPath(_config.root);
          
          // 合并 vite.assetsInclude 的文件
          const extraIncludeFiles = [...includeFiles];
          if (_config.vite?.assetsInclude) {
            const processAssetsInclude = (pattern: string | RegExp | (string | RegExp)[]) => {
              if (typeof pattern === 'string') {
                try {
                  const matched = globSync(pattern, { cwd: rootDir, absolute: false });
                  matched.forEach(file => extraIncludeFiles.push(file));
                } catch (e) {
                  logger.warn(`Failed to match vite.assetsInclude pattern "${pattern}": ${e}`);
                }
              } else if (pattern instanceof RegExp) {
                // RegExp 暂不支持，跳过
              } else if (Array.isArray(pattern)) {
                for (const p of pattern) {
                  processAssetsInclude(p);
                }
              }
            };
            processAssetsInclude(_config.vite.assetsInclude);
          }
          
          // 处理依赖
          const { packageNames, fileList } = await analyzeDependencies(rootDir, serverDir, logger, _nftCache);
          createSimpleServerPackageJson(serverDir);
          await copyDependencies(rootDir, serverDir, fileList, logger, extraIncludeFiles, excludeFiles);
          
          optimizeNodeModules(serverDir, logger);
          createServerEntryFile(serverDir);
        }

        // 生成路由配置文件（仅在 SSR 模式下）
        if (_buildOutput === 'server') {
          createMetaConfig(routes, edgeoneDir, serverDir);
        }
        // static 模式下不需要 meta.json
        
        // 清理 Astro 构建的临时文件（仅在 SSR 模式下）
        if (_buildOutput === 'server') {
          try {
            rmSync(fileURLToPath(_config.build.server), { recursive: true, force: true });
          } catch (error) {
            logger.warn(`Failed to clean up build temp files: ${error}`);
          }
        }

        logger.info(`✅ Build complete! Ready to deploy to EdgeOne Pages.`);
      },
    },
  };
}
