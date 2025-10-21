/**
 * 修补 _image.astro.mjs 文件，添加详细的错误信息
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Logger } from './types.js';

/**
 * 修补 _image 端点，添加详细的 404 错误信息
 */
export function patchImageEndpoint(serverDir: string, logger: Logger): void {
  const imageFilePath = join(serverDir, 'pages', '_image.astro.mjs');
  
  if (!existsSync(imageFilePath)) {
    logger.warn('_image.astro.mjs not found, skipping patch');
    return;
  }
  
  try {
    let content = readFileSync(imageFilePath, 'utf-8');
    
    // 修复1：从 headers 获取真实的域名（而不是内部域名）
    const originalSourceUrl = 'const sourceUrl = new URL(transform.src, url.origin);';
    const patchedSourceUrl = `// 从 headers 获取真实域名（EdgeOne 的 request.url 是内部域名）
    // 尝试所有可能包含真实域名的 headers
    function getRealHost(headers) {
      // 尝试各种可能的 host headers
      const hostHeaders = [
        'x-forwarded-host',
        'x-real-host', 
        'x-original-host',
        'x-host',
        'forwarded-host',
        'x-forwarded-server'
      ];
      
      for (const h of hostHeaders) {
        const value = headers.get(h);
        if (value) return value;
      }
      
      // 尝试从 origin header 提取
      const origin = headers.get('origin');
      if (origin && origin.startsWith('http')) {
        try {
          return new URL(origin).host;
        } catch {}
      }
      
      // 尝试从 referer header 提取
      const referer = headers.get('referer');
      if (referer && referer.startsWith('http')) {
        try {
          return new URL(referer).host;
        } catch {}
      }
      
      // 尝试从 x-original-url 提取（完整 URL）
      const originalUrl = headers.get('x-original-url');
      if (originalUrl && originalUrl.startsWith('http')) {
        try {
          return new URL(originalUrl).host;
        } catch {}
      }
      
      return null;
    }
    
    const realHost = getRealHost(request.headers);
    const realProto = request.headers.get('x-forwarded-proto') 
      || request.headers.get('x-forwarded-ssl') === 'on' ? 'https' : 'http'
      || (request.headers.get('x-forwarded-port') === '443' ? 'https' : 'http')
      || 'https';
    
    const realOrigin = realHost 
      ? \`\${realProto}://\${realHost}\`
      : url.origin;
    
    const sourceUrl = new URL(transform.src, realOrigin);`;

    // 修复2：移除或修复跨域检查（EdgeOne 的 url.origin 是内部域名）
    const originalCorsCheck = 'if (!isRemoteImage && sourceUrl.origin !== url.origin) {\n      return new Response("Forbidden", { status: 403 });\n    }';
    const patchedCorsCheck = `// EdgeOne fix: 跳过跨域检查，因为 url.origin 是内部域名
    // 原来的检查：if (!isRemoteImage && sourceUrl.origin !== url.origin)
    // 在 EdgeOne 中，sourceUrl 用的是真实域名，url.origin 是内部域名，总是不匹配
    if (false) { // 禁用这个检查
      return new Response("Forbidden", { status: 403 });
    }`;
    
    if (content.includes(originalCorsCheck)) {
      content = content.replace(originalCorsCheck, patchedCorsCheck);
      logger.info('Disabled CORS check for EdgeOne compatibility');
    }
    
    // 修复3：添加详细的 404 错误信息
    const original404 = 'return new Response("Not Found", { status: 404 });';
    const patched404 = `return new Response(JSON.stringify({
      error: "Image Origin Fetch Failed - 404",
      message: "Failed to fetch original image from source",
      sourceUrl: sourceUrl.href,
      realOrigin: realOrigin,
      requestUrl: url.href,
      headers: {
        host: request.headers.get('host'),
        xForwardedHost: request.headers.get('x-forwarded-host'),
        xForwardedProto: request.headers.get('x-forwarded-proto'),
        xForwardedServer: request.headers.get('x-forwarded-server'),
        xRealHost: request.headers.get('x-real-host'),
        xOriginalHost: request.headers.get('x-original-host'),
        xHost: request.headers.get('x-host'),
        forwardedHost: request.headers.get('forwarded-host'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        xOriginalUrl: request.headers.get('x-original-url'),
        allHeaders: Object.fromEntries(request.headers.entries())
      },
      transform: transform,
      timestamp: new Date().toISOString(),
      debug: "[EdgeOne Image Optimization] Original image not found or fetch failed"
    }), { 
      status: 404,
      headers: { "Content-Type": "application/json" }
    });`;
    
    // 应用修复
    if (content.includes(originalSourceUrl)) {
      content = content.replace(originalSourceUrl, patchedSourceUrl);
      logger.info('Patched sourceUrl construction to use real domain from headers');
    }
    
    if (content.includes(original404)) {
      content = content.replace(original404, patched404);
      logger.info('Patched 404 response with detailed error info');
    }
    
    writeFileSync(imageFilePath, content);
    logger.info('Successfully patched _image.astro.mjs');
  } catch (error) {
    logger.error(`Failed to patch _image.astro.mjs: ${error}`);
  }
}
