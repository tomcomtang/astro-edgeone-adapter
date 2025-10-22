/**
 * 配置文件生成模块
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MetaConfig, RouteConfig } from './types.js';

/**
 * 创建简化的 server-handler package.json（只包含 type: module）
 * 步骤3：确保 Linux Sharp 安装后，只写入 type: module
 */
export function createSimpleServerPackageJson(serverDir: string): void {
  const serverPackageJson = {
    name: 'edgeone-server-handler',
    type: 'module',
    version: '1.0.0',
    private: true
  };
  
  writeFileSync(
    join(serverDir, 'package.json'),
    JSON.stringify(serverPackageJson, null, 2)
  );
}

/**
 * 生成 meta.json 配置文件
 */
/**
 * 转换 Astro 路由为正则表达式（参考 Vercel）
 */
function convertRouteToRegex(route: string): string {
  // 特殊端点使用正则
  if (route === '/_image') {
    return '^/_image/?$';
  }
  
  // 动态路由转换
  if (route.includes('[')) {
    // /blog/[...slug] → ^/blog(?:/(.*?))?/?$
    if (route.includes('[...')) {
      const basePath = route.split('[')[0].replace(/\/$/, '');
      return `^${basePath}(?:/(.*?))?/?$`;
    }
    // /blog/[slug] → ^/blog/([^/]+?)/?$
    const basePath = route.split('[')[0];
    return `^${basePath}([^/]+?)/?$`;
  }
  
  // 普通路由
  if (route === '/') {
    return '^/$';
  }
  
  return `^${route}/?$`;
}

export function createMetaConfig(
  routes: any[],
  edgeoneDir: string
): void {
  const metaData: MetaConfig = {
    conf: {
      headers: [],
      redirects: [],
      rewrites: [],
      caches: [],
      has404: false,
    },
    has404: false,
    nextRoutes: routes.map(route => {
      const routeConfig: RouteConfig = {
        // 使用正则表达式
        path: convertRouteToRegex(route.route),
      };
      
      // 如果是静态路由（预渲染），添加isStatic标识
      if (route.prerender) {
        routeConfig.isStatic = true;
        routeConfig.srcRoute = route.route;
      }
      
      return routeConfig;
    }),
  };

  const metaPath = join(edgeoneDir, 'meta.json');
  writeFileSync(metaPath, JSON.stringify(metaData, null, 2));
}

