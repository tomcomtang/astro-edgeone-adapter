import { defineMiddleware } from 'astro:middleware';

// 安全中间件 - 为所有响应添加安全头部
const securityMiddleware = defineMiddleware(async (context, next) => {
  const response = await next();
  
  // 添加安全头部
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
});

// 导出中间件
export const onRequest = securityMiddleware;
