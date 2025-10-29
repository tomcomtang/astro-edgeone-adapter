import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const projects: Array<{
  id: string;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  category: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}> = [
  {
    id: '1',
    title: 'Astro EdgeOne 适配器',
    description: '为 Astro 框架开发的 EdgeOne Pages 适配器，支持 SSR、图片优化和 Actions 接口注册功能。',
    image: 'blog-placeholder-1.jpg',
    technologies: ['Astro', 'TypeScript', 'EdgeOne', 'Sharp'],
    githubUrl: 'https://github.com/tomcomtang/astro-edgeone-adapter',
    liveUrl: 'https://astro-edgeone-adapter.edgeone.run',
    category: 'Web Development',
    featured: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20'
  },
  {
    id: '2',
    title: 'React 电商平台',
    description: '基于 React 和 Node.js 构建的全栈电商平台，包含用户管理、商品展示、购物车和支付功能。',
    image: 'blog-placeholder-2.jpg',
    technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
    githubUrl: 'https://github.com/example/ecommerce-platform',
    liveUrl: 'https://ecommerce-demo.vercel.app',
    category: 'E-commerce',
    featured: true,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18'
  },
  {
    id: '3',
    title: 'Vue.js 任务管理应用',
    description: '使用 Vue.js 3 和 Composition API 开发的现代化任务管理应用，支持拖拽排序和实时同步。',
    image: 'blog-placeholder-3.jpg',
    technologies: ['Vue.js', 'Pinia', 'TypeScript', 'WebSocket'],
    githubUrl: 'https://github.com/example/task-manager',
    liveUrl: 'https://task-manager-demo.netlify.app',
    category: 'Productivity',
    featured: false,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-15'
  },
  {
    id: '4',
    title: 'Next.js 博客系统',
    description: '基于 Next.js 13 App Router 构建的现代化博客系统，支持 MDX、SEO 优化和评论功能。',
    image: 'blog-placeholder-4.jpg',
    technologies: ['Next.js', 'MDX', 'Prisma', 'PostgreSQL'],
    githubUrl: 'https://github.com/example/nextjs-blog',
    liveUrl: 'https://nextjs-blog-demo.vercel.app',
    category: 'Blog',
    featured: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-12'
  },
  {
    id: '5',
    title: 'Svelte 数据可视化',
    description: '使用 Svelte 和 D3.js 创建的数据可视化仪表板，支持多种图表类型和实时数据更新。',
    image: 'blog-placeholder-5.jpg',
    technologies: ['Svelte', 'D3.js', 'TypeScript', 'WebSocket'],
    githubUrl: 'https://github.com/example/data-viz',
    liveUrl: 'https://data-viz-demo.surge.sh',
    category: 'Data Visualization',
    featured: false,
    createdAt: '2023-12-28',
    updatedAt: '2024-01-08'
  },
  {
    id: '6',
    title: 'Node.js API 服务',
    description: '基于 Express.js 和 TypeScript 构建的高性能 RESTful API 服务，支持 JWT 认证、数据验证和缓存优化。提供完整的 API 文档和测试套件。',
    image: 'blog-placeholder-about.jpg',
    technologies: ['Node.js', 'Express', 'TypeScript', 'Redis'],
    githubUrl: 'https://github.com/example/nodejs-api',
    liveUrl: 'https://api-demo.herokuapp.com',
    category: 'Backend',
    featured: false,
    createdAt: '2023-12-20',
    updatedAt: '2024-01-05'
  }
];


export const server = {
  getAllProjects: defineAction({
    async handler() {
      console.log('=== getAllProjects Actions 接口被调用 ===');
      console.log('直接返回 projects 数组:', projects);
      console.log('=== getAllProjects Actions 接口调用完成 ===');

      // 确保返回正确的格式
      return {
        success: true,
        data: projects
      };
    },
  }),
};