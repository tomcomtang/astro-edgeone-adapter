/**
 * Server entry file generation utilities
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_PORT } from './constants.js';

const BOOTSTRAP_TEMPLATE = readFileSync(
  fileURLToPath(new URL('../static/bootstrap.js.txt', import.meta.url)),
  'utf8'
);

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
  createBootstrapFile(serverDir);
}

/**
 * Create bootstrap helper file
 */
export function createBootstrapFile(serverDir: string): void {
  writeFileSync(join(serverDir, 'bootstrap.js'), BOOTSTRAP_TEMPLATE);
}



/**
 * Generate server entry file content
 */
function generateServerEntryContent(serverEntryFile: string, port: number): string {
  return `import { createServer } from 'http';
import crypto from 'node:crypto';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { createFrameworkServer } from './bootstrap.js';

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

async  function astroHandler (req, res) {
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

    // await handleResponse(res, response);
    return response;
  } catch (error) {
    console.error('SSR Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<html><body><h1>Error</h1><p>' + error.message + '</p></body></html>');
  }
}

createFrameworkServer(astroHandler);
`;
}

