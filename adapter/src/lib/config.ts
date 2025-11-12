/**
 * Configuration generation utilities.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import type { MetaConfig, RouteConfig } from './types.js';

/**
 * Create a minimal server-handler package.json (type: module only)
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
 * Convert a route segment into a path pattern (for redirects source/destination).
 * Based on the Vercel adapter's getMatchPattern function.
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
 * Get redirect destination path.
 */
function getRedirectLocation(route: any, base: string): string {
  if (route.redirectRoute) {
    const pattern = getMatchPattern(route.redirectRoute.segments);
    return posix.join(base, pattern).replace(/\/\//g, '/');
  }
  const destination = typeof route.redirect === 'object' ? route.redirect.destination : route.redirect ?? '';
  // Check if it's a remote URL (starts with http:// or https://)
  if (destination.startsWith('http://') || destination.startsWith('https://')) {
    return destination;
  }
  return posix.join(base, destination).replace(/\/\//g, '/');
}

/**
 * Get redirect status code.
 */
function getRedirectStatus(route: any): number {
  if (typeof route.redirect === 'object') {
    return route.redirect.status;
  }
  return 301;
}

/**
 * Build a source path pattern from route segments (for redirects).
 */
function getRedirectSource(route: any, base: string): string {
  if (route.segments) {
    const pattern = getMatchPattern(route.segments);
    return posix.join(base, pattern).replace(/\/\//g, '/');
  }
  // If no segments exist, fall back to route.route
  return posix.join(base, route.route || '').replace(/\/\//g, '/');
}

/**
 * Generate meta.json config file.
 */
/**
 * Convert Astro route to regex (aligned with Vercel).
 * @param route - route path
 * @param trailingSlash - trailingSlash config: true=require, false=forbid, undefined=optional
 */
function convertRouteToRegex(route: string): string {
  // Fallback logic: used only when route.pattern is not available
  // Use optional trailing slash by default (/?$)
  
  // Dynamic route conversion
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
  
  // Static route
  if (route === '/') {
    return '^/$';
  }
  
  // Default to optional trailing slash
  return `^${route}/?$`;
}

export function createMetaConfig(
  routes: any[],
  edgeoneDir: string,
  serverHandlerDir: string,
  config?: { base?: string }
): void {
  // Extract redirect routes
  const redirectRoutes = routes.filter((route) => route.type === 'redirect');
  
  // Build redirects
  const redirects = redirectRoutes.map((route) => {
    const base = config?.base || '/';
    return {
      source: getRedirectSource(route, base),
      destination: getRedirectLocation(route, base),
      statusCode: getRedirectStatus(route)
    };
  });

  // Keep only non-redirect routes
  const normalRoutes = routes.filter((route) => route.type !== 'redirect');

  const metaData: MetaConfig = {
    conf: {
      headers: [],
      redirects,
      has404: false,
    },
    has404: false,
    nextRoutes: normalRoutes.map(route => {
      // Align with Vercel adapter: use route.patternRegex.source as-is
      // Vercel adapter reference: src: route.patternRegex.source
      let pattern: string;
      
      if (route.pattern) {
        // Use Astro-generated pattern; remove escapes for JSON serialization
        pattern = route.pattern.source.replace(/\\\//g, '/');
      } else {
        // If route.pattern is missing, fall back to conversion (normally Astro provides pattern)
        pattern = convertRouteToRegex(route.route);
        pattern = pattern.replace(/\\\//g, '/');
      }
      
      const routeConfig: RouteConfig = {
        // Use regex pattern
        path: pattern,
      };
      
      // If prerendered, mark as static
      if (route.prerender) {
        routeConfig.isStatic = true;
        routeConfig.srcRoute = route.route;
      }
      
      return routeConfig;
    }),
  };

  // Write to server-handler directory (SSR only, when directory exists)
  // Note: serverHandlerDir may equal edgeoneDir in static mode
  if (serverHandlerDir !== edgeoneDir && existsSync(serverHandlerDir)) {
    const serverMetaPath = join(serverHandlerDir, 'meta.json');
    writeFileSync(serverMetaPath, JSON.stringify(metaData, null, 2));
  }
  
  // Also write to .edgeone directory
  const edgeoneMetaPath = join(edgeoneDir, 'meta.json');
  writeFileSync(edgeoneMetaPath, JSON.stringify(metaData, null, 2));
}

