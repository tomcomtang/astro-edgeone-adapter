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
    
    // ⚠️ 不修改 Astro 的默认逻辑（sourceUrl 构造、跨域检查）
    // 只在 404 时添加详细的调试信息
    
    // 添加详细的 404 错误信息（保留 Astro 原始逻辑）
    const original404 = 'return new Response("Not Found", { status: 404 });';
    const patched404 = `return new Response(JSON.stringify({
      error: "Image Origin Fetch Failed - 404",
      message: "Failed to fetch original image from source",
      debug: "Testing if index.mjs real domain works with Astro original logic",
      sourceUrl: sourceUrl.href,
      requestUrl: url.href,
      urlOrigin: url.origin,
      transformSrc: transform.src,
      isRemoteImage: isRemoteImage,
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
      timestamp: new Date().toISOString()
    }), { 
      status: 404,
      headers: { "Content-Type": "application/json" }
    });`;
    
    // 只应用 404 修复，不修改其他逻辑
    if (content.includes(original404)) {
      content = content.replace(original404, patched404);
      logger.info('Patched 404 response with detailed debug info (keeping Astro original logic)');
    }
    
    writeFileSync(imageFilePath, content);
    logger.info('Successfully patched _image.astro.mjs');
  } catch (error) {
    logger.error(`Failed to patch _image.astro.mjs: ${error}`);
  }
}
