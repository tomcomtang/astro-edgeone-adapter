import type { APIRoute } from 'astro';
import { getAllAlbums, getAlbumById, createAlbum, updateAlbum, deleteAlbum, getAlbumCategories } from './albums/data';

export const GET: APIRoute = async ({ request, url }) => {
  const pathname = url.pathname;
  
  // 处理不同的 GET 请求
  if (pathname === '/api/albums/categories') {
    const result = await getAlbumCategories();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  if (pathname.startsWith('/api/albums/') && pathname !== '/api/albums/categories') {
    const result = await getAlbumById(request);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  // 默认获取所有相册
  const result = await getAllAlbums(request);
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const result = await createAlbum(request);
  return new Response(JSON.stringify(result), {
    status: result.success ? 201 : 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const result = await updateAlbum(request);
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const result = await deleteAlbum(request);
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
