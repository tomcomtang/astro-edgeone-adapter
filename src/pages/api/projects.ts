import type { APIRoute } from 'astro';
import { getAllProjects, getProjectById, createProject, updateProject, deleteProject, getProjectCategories } from '../../actions/projects';

export const GET: APIRoute = async ({ request, url }) => {
  const pathname = url.pathname;
  
  // 处理不同的 GET 请求
  if (pathname === '/api/projects/categories') {
    const result = await getProjectCategories();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  if (pathname.startsWith('/api/projects/') && pathname !== '/api/projects/categories') {
    const result = await getProjectById(request);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  // 默认获取所有项目
  const result = await getAllProjects(request);
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
  const formData = await request.formData();
  const result = await createProject(formData);
  return new Response(JSON.stringify(result), {
    status: result.success ? 201 : 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const result = await updateProject(request);
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const result = await deleteProject(request);
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
