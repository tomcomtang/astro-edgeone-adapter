
import { createServer } from 'http';
import {
  createRequestContext,
  runWithRequestContext,
} from './.edgeone/dist/run/handlers/request-context.cjs';
import serverHandler from './.edgeone/dist/run/handlers/server.js';
import { getTracer } from './.edgeone/dist/run/handlers/tracer.cjs';


  async function handleResponse(res, response, passHeaders = {}) {
    const startTime = Date.now();
    
    if (!response) {
      res.writeHead(404);
      res.end(JSON.stringify({
        error: "Not Found",
        message: "The requested path does not exist"
      }));
      const endTime = Date.now();
      console.log(`HandleResponse: 404 Not Found - ${endTime - startTime}ms`);
      return;
    }

    try {
      if (response instanceof Response) {
        const headers = Object.fromEntries(response.headers);
        Object.assign(headers, passHeaders);
        if (response.headers.get('eop-client-geo')) {
          // 删除 eop-client-geo 头部
          response.headers.delete('eop-client-geo');
        }
        
        // 检查是否是流式响应
        const isStream = response.body && (
          response.headers.get('content-type')?.includes('text/event-stream') ||
          response.headers.get('transfer-encoding')?.includes('chunked') ||
          response.body instanceof ReadableStream ||
          typeof response.body.pipe === 'function' ||
          response.headers.get('x-content-type-stream') === 'true'
        );

        if (isStream) {
          // 设置流式响应所需的头部
          const streamHeaders = {
            ...headers
          };

          if (response.headers.get('content-type')?.includes('text/event-stream')) {
            streamHeaders['Content-Type'] = 'text/event-stream';
          }

          res.writeHead(response.status, streamHeaders);

          if (typeof response.body.pipe === 'function') {
            response.body.pipe(res);
          } else {
            const reader = response.body.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
                  res.write(value);
                } else {
                  const chunk = new TextDecoder().decode(value);
                  res.write(chunk);
                }
              }
            } finally {
              reader.releaseLock();
              res.end();
            }
          }
        } else {
          // 普通响应
          res.writeHead(response.status, headers);
          const body = await response.text();
          res.end(body);
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
    } finally {
      const endTime = Date.now();
      console.log(`HandleResponse: ${response?.status || 'unknown'} - ${endTime - startTime}ms`);
    }
  }
  

process.env.USE_REGIONAL_BLOBS = 'true';
export default async function handler(req, context) {
  const requestContext = createRequestContext(req, context);
  const tracer = getTracer();

  const handlerResponse = await runWithRequestContext(requestContext, () => {
    return tracer.withActiveSpan('Next.js Server Handler', async (span) => {
      const response = await serverHandler(req, context, span, requestContext);
      return response;
    });
  });

  if (requestContext.serverTiming) {
    handlerResponse.headers.set('server-timing', requestContext.serverTiming);
  }

  return handlerResponse;
}

export const config = {
  path: '/*',
  preferStatic: true,
};

const port = 9000;
// const port = 9000;


// 实时流转换函数
function createReadableStreamFromRequest(req) {
  return new ReadableStream({
    start(controller) {
      req.on('data', chunk => {
        // 将Buffer转换为Uint8Array
        const uint8Array = new Uint8Array(chunk);
        controller.enqueue(uint8Array);
      });
      
      req.on('end', () => {
        controller.close();
      });
      
      req.on('error', error => {
        controller.error(error);
      });
    },
    
    cancel() {
      // 清理资源
      req.destroy();
    }
  });
}

const server = createServer(async (req, res) => {
  try {
    const requestStartTime = Date.now();
  
    // 构造 handler 需要的 req 对象（可根据需要扩展）
    const handlerReq = {
      ...req,
      headers: {
        ...req.headers,
        'accept-encoding': 'identity',
      },
      method: req.method,
      url: req.url,
    };

    // 读取 body（如果有）
    // let body = [];
    // req.on('data', chunk => body.push(chunk));
    // await new Promise(resolve => req.on('end', resolve));
    // if (body.length > 0) {
    //   handlerReq.body = Buffer.concat(body);
    // }

    handlerReq.body = createReadableStreamFromRequest(req);

    const response = await handler(handlerReq, {});

    response.headers.set('functions-request-id', req.headers['x-scf-request-id'] || '');

    const requestEndTime = Date.now();
    const url = new URL(req.url, `http://${req.headers.host}`);
    console.log(`Request path: ${url.pathname}`);
    console.log(`Request processing time: ${requestEndTime - requestStartTime}ms`);
    await handleResponse(res, response, {
      'functions-request-id': req.headers['x-scf-request-id'] || ''
    });
    return;
  } catch (error) {
    console.error('SSR Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<html><body><h1>Error</h1><p>'+error.message+'</p></body></html>');
  }
});

server.listen(port, () => {
  console.log('Server is running on http://localhost:9000');
});
  