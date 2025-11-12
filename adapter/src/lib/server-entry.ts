/**
 * Server entry file generation utilities
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_PORT } from './constants.js';

/**
 * Create server entry file index.mjs
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
 * Generate server entry file content
 */
function generateServerEntryContent(serverEntryFile: string, port: number): string {
  return `import { createServer } from 'http';
import { webcrypto } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

// Ensure Web Crypto is available before loading Astro handler
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = ${port};

// Basic MIME type detection for static asset fallback
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

async function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const bodyBuffer = Buffer.concat(chunks);
        resolve(bodyBuffer.length ? bodyBuffer : undefined);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

async function handleResponse(res, response) {
  const startTime = Date.now();

  if (!response) {
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Route Not Found',
      message: 'The requested path does not match any route in Astro',
    }));
    return;
  }

  try {
    if (response instanceof Response) {
      const headers = Object.fromEntries(response.headers);

      const isStream = response.body && (
        response.headers.get('content-type')?.includes('text/event-stream') ||
        response.headers.get('transfer-encoding')?.includes('chunked') ||
        typeof response.body.pipe === 'function'
      );

      if (isStream) {
        res.writeHead(response.status, headers);
        if (typeof response.body.pipe === 'function') {
          response.body.pipe(res);
        } else {
          const reader = response.body.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
          } finally {
            reader.releaseLock();
            res.end();
          }
        }
        return;
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      res.writeHead(response.status, headers);
      res.end(buffer);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    }
  } catch (error) {
    console.error('HandleResponse error', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
    }));
  } finally {
    const endTime = Date.now();
    console.log('HandleResponse duration:', endTime - startTime, 'ms');
  }
}

const handlerPromise = import('./${serverEntryFile}');

const server = createServer(async (req, res) => {
  const requestStart = Date.now();
  try {
    const host = req.headers.host || 'localhost';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const url = new URL(req.url, proto + '://' + host);

    const { default: handler } = await handlerPromise;

    let bodyBuffer;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      bodyBuffer = await readRequestBody(req);
    }

    const headers = new Headers(req.headers);
    const requestInit = {
      method: req.method,
      headers,
      body: bodyBuffer,
    };

    const request = new Request(url.toString(), requestInit);
    const response = await handler(request);

    await handleResponse(res, response);

    const requestEnd = Date.now();
    console.log('Request path:', url.pathname, '- duration:', requestEnd - requestStart, 'ms');
  } catch (error) {
    console.error('SSR Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<html><body><h1>Error</h1><p>' + error.message + '</p></body></html>');
  }
});

server.listen(port, () => {
  console.log('Server is running on http://localhost:' + port);
});
`;
}

