/**
 * EdgeOne Astro Adapter
 * 
 * 用于将 Astro 项目部署到 EdgeOne Pages 的适配器
 */

import type { AstroAdapter, AstroIntegration, AstroConfig } from 'astro';
import { fileURLToPath } from 'node:url';
import { cpSync, mkdirSync } from 'node:fs';
import { 
  PACKAGE_NAME, 
  ASSETS_DIR, 
  SERVER_HANDLER_DIR 
} from './lib/constants.js';
import { copyDependencies } from './lib/dependencies.js';
import { optimizeNodeModules } from './lib/optimizer.js';
import { createServerPackageJson, createMetaConfig } from './lib/config.js';
import { createServerEntryFile } from './lib/server-entry.js';
import { cleanOutputDirectory } from './lib/clean.js';
import { patchImageEndpoint } from './lib/patch-image.js';
import { replaceSharpWithLinux } from './lib/replace-sharp.js';
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
          
          logger.info('Creating server-handler package.json...');
          createServerPackageJson(rootDir, serverDir);
          
          // EdgeOne 不会自动安装依赖，需要我们提供 node_modules
          // 虽然本地是 macOS，但我们会在构建后提供安装 Linux Sharp 的说明
          logger.info('Copying dependencies to server-handler...');
          await copyDependencies(rootDir, serverDir, logger);
          
          logger.info('Optimizing node_modules size...');
          optimizeNodeModules(serverDir, logger);
          
          logger.info('Creating server entry index.mjs...');
          createServerEntryFile(serverDir);
          
          // 修补 _image 端点，添加详细的错误信息
          // index.mjs 已经使用真实域名，但仍然 patch 以获得详细调试信息
          logger.info('Patching _image endpoint with debug information...');
          patchImageEndpoint(serverDir, logger);
          
          // 替换 Sharp 为 Linux 版本（EdgeOne 兼容性）
          await replaceSharpWithLinux(serverDir, logger);
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
