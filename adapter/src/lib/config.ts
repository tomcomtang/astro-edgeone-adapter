/**
 * 配置文件生成模块
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import type { MetaConfig, RouteConfig } from './types.js';

/**
 * 创建简化的 server-handler package.json（只包含 type: module）
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
 * 转换路由段为路径模式（用于 redirects 的 source 和 destination）
 * 参考 Vercel 适配器的 getMatchPattern 函数
 */
const ROUTE_DYNAMIC_SPLIT = /\[(.+?\(.+?\)|.+?)\]/;
const ROUTE_SPREAD = /^\.{3}.+$/;

function getParts(part: string, file: string) {
  const result: Array<{ content: string; dynamic: boolean; spread: boolean }> = [];
  part.split(ROUTE_DYNAMIC_SPLIT).forEach((str, i) => {
    if (!str) return;
    const dynamic = i % 2 === 1;
    const match = dynamic ? /([^(]+)$/.exec(str) : null;
    const content = dynamic ? (match ? match[1] : null) : str;
    if (!content || (dynamic && !/^(?:\.\.\.)?[\w$]+$/.test(content))) {
      throw new Error(`Invalid route ${file} — parameter name must match /^[a-zA-Z0-9_$]+$/`);
    }
    result.push({
      content,
      dynamic,
      spread: dynamic && ROUTE_SPREAD.test(content)
    });
  });
  return result;
}

function getMatchPattern(segments: any[][]): string {
  return segments
    .map((segment) => {
      return segment
        .map((part: any) => {
          if (part.spread) {
            const paramName = part.content.startsWith('...') ? part.content.slice(3) : part.content;
            return `:${paramName}*`;
          }
          if (part.dynamic) {
            return `:${part.content}`;
          }
          return part.content;
        })
        .join('');
    })
    .join('/');
}

/**
 * 获取重定向目标路径
 */
function getRedirectLocation(route: any, base: string): string {
  if (route.redirectRoute) {
    const pattern = getMatchPattern(route.redirectRoute.segments);
    return posix.join(base, pattern).replace(/\/\//g, '/');
  }
  const destination = typeof route.redirect === 'object' ? route.redirect.destination : route.redirect ?? '';
  // 检查是否是远程路径（以 http:// 或 https:// 开头）
  if (destination.startsWith('http://') || destination.startsWith('https://')) {
    return destination;
  }
  return posix.join(base, destination).replace(/\/\//g, '/');
}

/**
 * 获取重定向状态码
 */
function getRedirectStatus(route: any): number {
  if (typeof route.redirect === 'object') {
    return route.redirect.status;
  }
  return 301;
}

/**
 * 从路由段生成源路径模式（用于 redirects）
 */
function getRedirectSource(route: any, base: string): string {
  if (route.segments) {
    const pattern = getMatchPattern(route.segments);
    return posix.join(base, pattern).replace(/\/\//g, '/');
  }
  // 如果没有 segments，使用 route.route 作为 fallback
  return posix.join(base, route.route || '').replace(/\/\//g, '/');
}

/**
 * 生成 meta.json 配置文件
 */
/**
 * 转换 Astro 路由为正则表达式（参考 Vercel）
 * @param route - 路由路径
 * @param trailingSlash - trailingSlash 配置：true=总是需要, false=不要, undefined=可选
 */
function convertRouteToRegex(route: string): string {
  // Fallback 函数：只有当 route.pattern 不存在时才会用到
  // 默认使用可选尾部斜杠（/?$）
  
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
  
  // 默认使用可选尾部斜杠
  return `^${route}/?$`;
}

export function createMetaConfig(
  routes: any[],
  edgeoneDir: string,
  serverHandlerDir: string,
  config?: { base?: string }
): void {
  // 提取 redirect 路由
  const redirectRoutes = routes.filter((route) => route.type === 'redirect');
  
  // 处理 redirects
  const redirects = redirectRoutes.map((route) => {
    const base = config?.base || '/';
    return {
      source: getRedirectSource(route, base),
      destination: getRedirectLocation(route, base),
      statusCode: getRedirectStatus(route)
    };
  });

  // 过滤掉 redirect 路由，只保留普通路由
  const normalRoutes = routes.filter((route) => route.type !== 'redirect');

  const metaData: MetaConfig = {
    conf: {
      headers: [],
      redirects,
      has404: false,
    },
    has404: false,
    nextRoutes: normalRoutes.map(route => {
      // 完全对齐 Vercel 适配器：直接使用 route.patternRegex.source，不做任何修改
      // Vercel 适配器代码：src: route.patternRegex.source
      let pattern: string;
      
      if (route.pattern) {
        // 直接使用 Astro 生成的 pattern，只移除转义以便 JSON 序列化
        pattern = route.pattern.source.replace(/\\\//g, '/');
      } else {
        // 如果没有 route.pattern，使用 fallback 转换（但通常 Astro 都会提供 pattern）
        pattern = convertRouteToRegex(route.route);
        pattern = pattern.replace(/\\\//g, '/');
      }
      
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

