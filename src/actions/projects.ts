/**
 * 项目案例 Actions
 * 
 * 这个文件展示了如何在 Astro EdgeOne 适配器中实现项目案例管理
 */

// 模拟项目案例数据存储（实际项目中应该使用数据库）
const projects: Array<{
  id: string;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  category: string;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}> = [
  {
    id: '1',
    title: 'Astro EdgeOne 适配器',
    description: '为 Astro 框架开发的 EdgeOne Pages 适配器，支持 SSR、图片优化和 Actions 接口注册功能。',
    image: '/_astro/blog-placeholder-1.Bx0Zcyzv.jpg',
    technologies: ['Astro', 'TypeScript', 'EdgeOne', 'Sharp'],
    githubUrl: 'https://github.com/tomcomtang/astro-edgeone-adapter',
    liveUrl: 'https://astro-edgeone-adapter.edgeone.run',
    category: 'Web Development',
    featured: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '2',
    title: 'React 电商平台',
    description: '基于 React 和 Node.js 构建的全栈电商平台，包含用户管理、商品展示、购物车和支付功能。',
    image: '/_astro/blog-placeholder-2.1WQRLJGH.jpg',
    technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
    githubUrl: 'https://github.com/example/ecommerce-platform',
    liveUrl: 'https://ecommerce-demo.vercel.app',
    category: 'E-commerce',
    featured: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18')
  },
  {
    id: '3',
    title: 'Vue.js 任务管理应用',
    description: '使用 Vue.js 3 和 Composition API 开发的现代化任务管理应用，支持拖拽排序和实时同步。',
    image: '/_astro/blog-placeholder-3.ijrf8Ohr.jpg',
    technologies: ['Vue.js', 'Pinia', 'TypeScript', 'WebSocket'],
    githubUrl: 'https://github.com/example/task-manager',
    liveUrl: 'https://task-manager-demo.netlify.app',
    category: 'Productivity',
    featured: false,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '4',
    title: 'Next.js 博客系统',
    description: '基于 Next.js 13 App Router 构建的现代化博客系统，支持 MDX、SEO 优化和评论功能。',
    image: '/_astro/blog-placeholder-4.gLBdjEDe.jpg',
    technologies: ['Next.js', 'MDX', 'Prisma', 'PostgreSQL'],
    githubUrl: 'https://github.com/example/nextjs-blog',
    liveUrl: 'https://nextjs-blog-demo.vercel.app',
    category: 'Blog',
    featured: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-12')
  },
  {
    id: '5',
    title: 'Svelte 数据可视化',
    description: '使用 Svelte 和 D3.js 创建的数据可视化仪表板，支持多种图表类型和实时数据更新。',
    image: '/_astro/blog-placeholder-5.CB3Xi-gp.jpg',
    technologies: ['Svelte', 'D3.js', 'TypeScript', 'WebSocket'],
    githubUrl: 'https://github.com/example/data-viz',
    liveUrl: 'https://data-viz-demo.surge.sh',
    category: 'Data Visualization',
    featured: false,
    createdAt: new Date('2023-12-28'),
    updatedAt: new Date('2024-01-08')
  }
];

/**
 * 获取所有项目案例
 */
export async function getAllProjects(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const featured = url.searchParams.get('featured');
  const limit = url.searchParams.get('limit');
  const offset = url.searchParams.get('offset');

  let filteredProjects = [...projects];

  // 按分类筛选
  if (category && category !== 'all') {
    filteredProjects = filteredProjects.filter(project => 
      project.category.toLowerCase() === category.toLowerCase()
    );
  }

  // 按精选筛选
  if (featured === 'true') {
    filteredProjects = filteredProjects.filter(project => project.featured);
  }

  // 排序（精选优先，然后按更新时间）
  filteredProjects.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  // 分页
  const startIndex = offset ? parseInt(offset) : 0;
  const endIndex = limit ? startIndex + parseInt(limit) : filteredProjects.length;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  return {
    success: true,
    data: {
      projects: paginatedProjects,
      total: filteredProjects.length,
      hasMore: endIndex < filteredProjects.length
    }
  };
}

/**
 * 获取单个项目案例详情
 */
export async function getProjectById(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return {
      success: false,
      error: 'Project ID is required'
    };
  }

  const project = projects.find(p => p.id === id);

  if (!project) {
    return {
      success: false,
      error: 'Project not found'
    };
  }

  return {
    success: true,
    data: project
  };
}

/**
 * 创建新项目案例
 */
export async function createProject(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const image = formData.get('image') as string;
  const technologies = formData.get('technologies') as string;
  const githubUrl = formData.get('githubUrl') as string;
  const liveUrl = formData.get('liveUrl') as string;
  const category = formData.get('category') as string;
  const featured = formData.get('featured') === 'true';

  // 输入验证
  if (!title || !description || !category) {
    return {
      success: false,
      error: 'Missing required fields: title, description, category'
    };
  }

  // 创建新项目
  const newProject = {
    id: Math.random().toString(36).substr(2, 9),
    title,
    description,
    image: image || '/_astro/blog-placeholder-about.BtEdEmGp.jpg',
    technologies: technologies ? technologies.split(',').map(t => t.trim()) : [],
    githubUrl: githubUrl || undefined,
    liveUrl: liveUrl || undefined,
    category,
    featured,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  projects.push(newProject);

  return {
    success: true,
    message: 'Project created successfully',
    data: newProject
  };
}

/**
 * 更新项目案例
 */
export async function updateProject(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return {
      success: false,
      error: 'Project ID is required'
    };
  }

  const projectIndex = projects.findIndex(p => p.id === id);

  if (projectIndex === -1) {
    return {
      success: false,
      error: 'Project not found'
    };
  }

  const formData = await request.formData();
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const image = formData.get('image') as string;
  const technologies = formData.get('technologies') as string;
  const githubUrl = formData.get('githubUrl') as string;
  const liveUrl = formData.get('liveUrl') as string;
  const category = formData.get('category') as string;
  const featured = formData.get('featured') === 'true';

  // 更新项目信息
  const updatedProject = {
    ...projects[projectIndex],
    title: title || projects[projectIndex].title,
    description: description || projects[projectIndex].description,
    image: image || projects[projectIndex].image,
    technologies: technologies ? technologies.split(',').map(t => t.trim()) : projects[projectIndex].technologies,
    githubUrl: githubUrl || projects[projectIndex].githubUrl,
    liveUrl: liveUrl || projects[projectIndex].liveUrl,
    category: category || projects[projectIndex].category,
    featured: featured !== undefined ? featured : projects[projectIndex].featured,
    updatedAt: new Date()
  };

  projects[projectIndex] = updatedProject;

  return {
    success: true,
    message: 'Project updated successfully',
    data: updatedProject
  };
}

/**
 * 删除项目案例
 */
export async function deleteProject(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return {
      success: false,
      error: 'Project ID is required'
    };
  }

  const projectIndex = projects.findIndex(p => p.id === id);

  if (projectIndex === -1) {
    return {
      success: false,
      error: 'Project not found'
    };
  }

  const deletedProject = projects.splice(projectIndex, 1)[0];

  return {
    success: true,
    message: 'Project deleted successfully',
    data: deletedProject
  };
}

/**
 * 获取项目分类列表
 */
export async function getProjectCategories() {
  const categories = [...new Set(projects.map(p => p.category))];
  
  return {
    success: true,
    data: categories
  };
}
