/**
 * 服务器入口文件生成模块
 */

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { DEFAULT_PORT } from './constants.js';

/**
 * 创建服务器入口文件 index.mjs
 */
export function createServerEntryFile(
  serverDir: string,
  serverEntryFile: string,
  port: number = DEFAULT_PORT
): void {
  const indexContent = generateServerEntryContent(serverEntryFile, port);
  writeFileSync(join(serverDir, 'index.mjs'), indexContent);
}

/**
 * 生成服务器入口文件内容
 */
function generateServerEntryContent(serverEntryFile: string, port: number): string {
  return `import { createServer } from 'http';
import { webcrypto } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

// Polyfill for Web Crypto API in Node.js - must be set before importing server entry
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

// Polyfill for fetch API with duplex support for EdgeOne compatibility
if (!globalThis.fetch) {
  try {
    const { fetch: nodeFetch } = require('node:fetch');
    globalThis.fetch = nodeFetch;
  } catch (e) {
    // Fallback to undici if node:fetch is not available
    try {
      const { fetch: undiciFetch } = require('undici');
      globalThis.fetch = undiciFetch;
    } catch (e2) {
      console.warn('No fetch implementation available');
    }
  }
}

// Override fetch to automatically add duplex option for POST requests with body
if (globalThis.fetch) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = function(input, init) {
    // If it's a POST request with a body, add duplex: 'half'
    if (init && init.method === 'POST' && init.body && !init.duplex) {
      init.duplex = 'half';
    }
    return originalFetch.call(this, input, init);
  };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = ${port};

// MIME type mapping
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// 完全避免流式处理 - 直接读取请求体并验证 JSON
async function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => {
      chunks.push(chunk);
    });
    
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      
      // 验证 JSON 格式
      try {
        if (body.trim()) {
          JSON.parse(body); // 验证是否为有效 JSON
        }
        resolve(body);
      } catch (jsonError) {
        console.error('Invalid JSON in request body:', body);
        reject(new TypeError('Invalid JSON format'));
      }
    });
    
    req.on('error', reject);
  });
}

async function handleResponse(res, response) {
  if (!response) {
    res.writeHead(404);
    res.end(JSON.stringify({
      error: "Route Not Found",
      message: "The requested path does not match any route in Astro"
    }));
    return;
  }

  try {
    if (response instanceof Response) {
      const headers = Object.fromEntries(response.headers);
      
      // EdgeOne 修复：使用 arrayBuffer 一次性读取，避免 chunked encoding 问题
      // 移除 content-length，让 Node.js 自动处理
      delete headers['content-length'];
      delete headers['Content-Length'];
      
      if (response.body) {
        try {
          // 一次性读取所有内容
          const buffer = await response.arrayBuffer();
          
          // 设置正确的 Content-Length
          headers['Content-Length'] = buffer.byteLength.toString();
          
          res.writeHead(response.status, headers);
          res.end(Buffer.from(buffer));
        } catch (bufferError) {
          console.error('Buffer read error:', bufferError);
          res.writeHead(500);
          res.end('Internal Server Error');
        }
      } else {
        // 没有 body
        res.writeHead(response.status, headers);
        res.end();
      }
    } else {
      // 非 Response 对象，直接返回 JSON
      res.writeHead(200, {
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify(response));
    }
  } catch (error) {
    console.error('HandleResponse error', error);
    // 错误处理
    res.writeHead(500);
    res.end(JSON.stringify({
      error: "Internal Server Error",
      message: error.message
    }));
  }
}

// Dynamically import handler after crypto is set up
const handlerPromise = import('./${serverEntryFile}');

const server = createServer(async (req, res) => {
  try {
    // 构造完整的 URL（使用真实域名，而不是内部域名）
    // EdgeOne 不提供 x-forwarded-host，需要从 referer 或 origin 中提取
    function getRealHost(headers) {
      // 1. 尝试标准的 forwarded headers
      const forwardedHeaders = [
        'x-forwarded-host',
        'x-real-host',
        'x-original-host',
        'x-host',
        'forwarded-host',
        'x-forwarded-server'
      ];
      
      for (const h of forwardedHeaders) {
        const value = headers[h];
        if (value) return value;
      }
      
      // 2. 从 origin header 提取
      const origin = headers.origin;
      if (origin && origin.startsWith('http')) {
        try {
          return new URL(origin).host;
        } catch {}
      }
      
      // 3. 从 referer header 提取（EdgeOne 会提供这个）
      const referer = headers.referer;
      if (referer && referer.startsWith('http')) {
        try {
          return new URL(referer).host;
        } catch {}
      }
      
      // 4. 回退到 host（内部域名）
      return headers.host;
    }
    
    const realHost = getRealHost(req.headers);
    const realProto = req.headers['x-forwarded-proto'] || 'https';
    const url = new URL(req.url, \`\${realProto}://\${realHost}\`);
    
    // 处理静态资源请求（用于 _image 端点的内部 fetch）
    // 支持路径：/_astro/*, /fonts/*, /favicon.svg 等
    const staticPrefixes = ['/_astro/', '/fonts/', '/favicon.svg'];
    const isStaticRequest = staticPrefixes.some(prefix => url.pathname.startsWith(prefix) || url.pathname === prefix);
    
    if (isStaticRequest) {
      // 从 ../assets/ 读取静态文件
      const assetsDir = join(__dirname, '..', 'assets');
      const filePath = join(assetsDir, url.pathname);
      
      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath);
          const mimeType = getMimeType(filePath);
          
          res.writeHead(200, {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Length': content.length
          });
          res.end(content);
          return;
        } catch (error) {
          console.error(\`Error serving static file \${url.pathname}:\`, error);
          // 继续到 SSR 处理
        }
      }
    }
    
    // Import handler
    const { default: handler } = await handlerPromise;
    
    // 构造标准的 Request 对象 - 避免流式处理
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await getRequestBody(req);
    }
    
    // 处理 headers
    const headers = new Headers(req.headers);
    
    const request = new Request(url.toString(), {
      method: req.method,
      headers: headers,
      body: body,
    });

    // 调用 Astro handler
    const response = await handler(request);
    
    await handleResponse(res, response);
  } catch (error) {
    console.error('SSR Error:', error);
    
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<html><body><h1>Error</h1><p>' + error.message + '</p></body></html>');
  }
});

server.listen(port, () => {
  console.log(\`Server is running on http://localhost:\${port}\`);
});
`;
}

