import type { SSRManifest } from 'astro';
import { App } from 'astro/app';

export function createExports(manifest: SSRManifest) {
  const app = new App(manifest);

  const handler = async (request: Request): Promise<Response> => {
    // Handle static assets
    if (request.url.includes('/static/')) {
      return new Response(null, { status: 404 });
    }

    // Handle SSR
    const routeData = app.match(request);
    
    if (!routeData) {
      return new Response('Not found', { status: 404 });
    }

    return app.render(request, { routeData });
  };

  return { default: handler };
}

