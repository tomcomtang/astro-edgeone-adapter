import { defineMiddleware } from 'astro:middleware';

const FORBIDDEN_PATHS = ['/forbidden'];

const securityMiddleware = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  if (FORBIDDEN_PATHS.some((path) => url.pathname.startsWith(path))) {
    if (url.pathname !== '/403') {
      return context.redirect('/403', 302);
    }
  }

  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  return response;
});

export const onRequest = securityMiddleware;
