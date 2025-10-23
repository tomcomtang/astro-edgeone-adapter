import type { APIRoute } from 'astro';
import { getAlbumById, updateAlbum, deleteAlbum } from '../../../actions/albums';

export const GET: APIRoute = async ({ request, params }) => {
  // 构造带有 id 参数的请求
  const url = new URL(request.url);
  url.searchParams.set('id', params.id as string);
  const modifiedRequest = new Request(url.toString(), request);
  
  const result = await getAlbumById(modifiedRequest);
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const PUT: APIRoute = async ({ request, params }) => {
  // 构造带有 id 参数的请求
  const url = new URL(request.url);
  url.searchParams.set('id', params.id as string);
  const modifiedRequest = new Request(url.toString(), request);
  
  const result = await updateAlbum(modifiedRequest);
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  // 构造带有 id 参数的请求
  const url = new URL(request.url);
  url.searchParams.set('id', params.id as string);
  const modifiedRequest = new Request(url.toString(), request);
  
  const result = await deleteAlbum(modifiedRequest);
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
