<script lang="ts">
  import { onMount } from 'svelte';
  import { actions } from 'astro:actions';
  
  // 项目类型定义
  interface Project {
    id: string;
    title: string;
    description: string;
    category: string;
    technologies: string[];
    image: string;
    githubUrl?: string;
    liveUrl?: string;
    featured: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  // 响应式数据
  let projects: Project[] = [];
  let loading = true;
  let error: string | null = null;
  
  // 图片映射 - 动态构建图片路径
  const getImageUrl = (imageName: string): string => {
    // 在开发模式下使用本地文件系统路径
    if (import.meta.env.DEV) {
      return `/_image?href=%2F%40fs%2FUsers%2Ftomcomtang%2FVscodeProjects%2Fvideo_fe%2Fedgeone-pages-templates%2Fastro-examples%2Fastro-edgeone-adapter%2Fsrc%2Fassets%2F${imageName}%3ForigWidth%3D960%26origHeight%3D480%26origFormat%3Djpg&w=300&h=270&f=webp`;
    }
    
    // 在生产模式下使用构建后的静态资源路径
    const imageMap: Record<string, string> = {
      'blog-placeholder-1.jpg': 'blog-placeholder-1.Bx0Zcyzv.jpg',
      'blog-placeholder-2.jpg': 'blog-placeholder-2.1WQRLJGH.jpg',
      'blog-placeholder-3.jpg': 'blog-placeholder-3.ijrf8Ohr.jpg',
      'blog-placeholder-4.jpg': 'blog-placeholder-4.gLBdjEDe.jpg',
      'blog-placeholder-5.jpg': 'blog-placeholder-5.CB3Xi-gp.jpg',
      'blog-placeholder-about.jpg': 'blog-placeholder-about.BtEdEmGp.jpg',
    };
    
    const hashedName = imageMap[imageName] || imageName;
    return `/_image?href=%2F_astro%2F${hashedName}&w=300&h=270&f=webp`;
  };
  
  // 加载项目数据 - 使用 Actions 接口
  const loadProjects = async () => {
    try {
      loading = true;
      error = null;
      
      console.log('开始调用 Actions 接口...');
      console.log('actions 对象:', actions);
      
      // 调用 defineAction 注册的接口
      const { data, error: actionError } = await actions.getAllProjects({});
      
      console.log('Actions Response data:', data);
      console.log('Actions Response error:', actionError);
      
      if (actionError) {
        throw new Error(actionError.message || 'Action failed');
      }
      
      if (data) {
        // 处理返回的数据
        if (Array.isArray(data)) {
          // 如果 data 是数组，直接使用
          projects = data.map((project: Project) => ({
            ...project,
            image: getImageUrl(project.image)
          }));
          console.log('Projects loaded from Actions (array):', projects);
        } else if (data.success && data.data) {
          // 如果 data 是包装对象
          projects = data.data.map((project: Project) => ({
            ...project,
            image: getImageUrl(project.image)
          }));
          console.log('Projects loaded from Actions (wrapped):', projects);
        } else {
          throw new Error('Unexpected data format');
        }
      } else {
        throw new Error('No data received');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to load projects:', err);
      console.error('Error details:', err);
    } finally {
      loading = false;
    }
  };
  
  // 组件挂载时加载数据
  onMount(() => {
    loadProjects();
  });
</script>

<div class="projects-wrapper">
  <!-- 项目列表 -->
  <div class="projects-container">
    <div class="projects-list">
      {#each projects as project (project.id)}
        <div class="project-card" class:featured={project.featured}>
          <div class="project-image">
            <img
              src={project.image}
              alt={project.title}
              loading="lazy"
            />
            {#if project.featured}
              <div class="featured-badge">⭐ 精选</div>
            {/if}
          </div>

          <div class="project-content">
            <div class="project-content-wrapper">
              <div class="project-header">
                <h3 class="project-title">{project.title}</h3>
                <span class="project-category">{project.category}</span>
              </div>

              <p class="project-description">{project.description}</p>

              <div class="project-technologies">
                {#each project.technologies as tech}
                  <span class="tech-tag">{tech}</span>
                {/each}
              </div>

              <div class="project-links">
                {#if project.githubUrl}
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="project-link github"
                  >
                    📁 GitHub
                  </a>
                {/if}
                {#if project.liveUrl}
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="project-link live"
                  >
                    🌐 在线预览
                  </a>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- 导航 -->
  <div class="navigation">
    <a href="/" class="back-link">← 返回首页</a>
    <a href="/albums" class="next-link">查看相册 →</a>
  </div>

  <!-- 加载状态 -->
  {#if loading}
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>正在加载项目...</p>
    </div>
  {/if}

  <!-- 错误状态 -->
  {#if error}
    <div class="error">
      <p>❌ 加载失败: {error}</p>
      <button on:click={loadProjects} class="retry-btn">重试</button>
    </div>
  {/if}
</div>

<style>
  .projects-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .projects-container {
    width: 100%;
  }

  .projects-list {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    width: 100%;
  }

  .project-card {
    display: flex;
    background: var(--theme-bg-secondary);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    min-height: 300px;
    width: 100%;
  }

  .project-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .project-card.featured {
    border: 2px solid var(--theme-accent);
  }

  .project-image {
    position: relative;
    width: 25%;
    min-height: 300px;
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem 1rem 1.5rem 1.5rem;
  }

  .project-image img {
    width: 100%;
    height: calc(300px - 3rem);
    object-fit: cover;
    flex-shrink: 0;
    border-radius: 8px;
  }

  .featured-badge {
    position: absolute;
    top: calc(1rem + 1.5rem);
    right: 1rem;
    background: var(--theme-accent);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .project-content {
    flex: 1;
    padding: 2rem;
    display: flex;
    align-items: center;
    min-height: 300px;
  }

  .project-content-wrapper {
    width: 100%;
  }

  .project-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .project-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--theme-text);
    margin: 0;
    line-height: 1.2;
  }

  .project-category {
    background: var(--theme-bg-code);
    color: var(--theme-text-secondary);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .project-description {
    color: var(--theme-text-secondary);
    line-height: 1.6;
    margin: 0 0 1.5rem 0;
    font-size: 1rem;
  }

  .project-technologies {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .tech-tag {
    background: var(--theme-bg-tertiary);
    color: var(--theme-text-secondary);
    padding: 0.25rem 0.75rem;
    border-radius: 16px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .project-links {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .project-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .project-link.github {
    background: var(--theme-bg-tertiary);
    color: var(--theme-text);
    border: 1px solid var(--theme-border);
  }

  .project-link.github:hover {
    background: var(--theme-bg-code);
    transform: translateY(-1px);
  }

  .project-link.live {
    background: var(--theme-accent);
    color: white;
  }

  .project-link.live:hover {
    background: var(--theme-accent-hover);
    transform: translateY(-1px);
  }

  .navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--theme-border);
  }

  .back-link,
  .next-link {
    color: var(--theme-accent);
    text-decoration: none;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .back-link:hover,
  .next-link:hover {
    background: var(--theme-bg-secondary);
    transform: translateY(-1px);
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--theme-border);
    border-top: 4px solid var(--theme-accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    background: var(--theme-bg-secondary);
    border-radius: 12px;
    margin: 2rem 0;
  }

  .retry-btn {
    background: var(--theme-accent);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1rem;
    transition: all 0.2s ease;
  }

  .retry-btn:hover {
    background: var(--theme-accent-hover);
    transform: translateY(-1px);
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .projects-wrapper {
      padding: 1rem;
    }

    .project-card {
      flex-direction: column;
    }

    .project-image {
      width: 100%;
      height: 200px;
    }

    .project-image img {
      height: 200px;
    }

    .project-content {
      width: 100%;
      padding: 1.5rem;
      min-height: auto;
    }

    .project-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .project-title {
      font-size: 1.25rem;
    }

    .navigation {
      flex-direction: column;
      gap: 1rem;
    }
  }
</style>
