/**
 * 配置文件生成模块
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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
  edgeoneDir: string,
  serverHandlerDir: string
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
      // 使用 route.pattern（如果存在）作为正则表达式，否则转换 route.route
      // route.pattern 是 Astro 自动生成的 RegExp，使用 source 获取字符串
      let pattern = route.pattern?.source || convertRouteToRegex(route.route);
      
      // 移除 JSON.stringify 自动添加的反斜杠转义
      // 这样生成的是 ^/_image/?$ 而不是 ^\/_image\/?$
      pattern = pattern.replace(/\\\//g, '/');
      
      const routeConfig: RouteConfig = {
        // 使用正则表达式
        path: pattern,
      };
      
      // 如果是静态路由（预渲染），添加isStatic标识
      if (route.prerender) {
        routeConfig.isStatic = true;
        routeConfig.srcRoute = route.route;
      }
      
      return routeConfig;
    }),
  };

  // 生成到 server-handler 目录（仅当目录存在时）
  // 注意：serverHandlerDir 可能与 edgeoneDir 相同（static 模式）
  if (serverHandlerDir !== edgeoneDir && existsSync(serverHandlerDir)) {
    const serverMetaPath = join(serverHandlerDir, 'meta.json');
    writeFileSync(serverMetaPath, JSON.stringify(metaData, null, 2));
  }
  
  // 同时也生成到 .edgeone 目录
  const edgeoneMetaPath = join(edgeoneDir, 'meta.json');
  writeFileSync(edgeoneMetaPath, JSON.stringify(metaData, null, 2));
}

