<template>
  <div class="albums-wrapper">
    <!-- 相册列表 -->
    <div class="albums-container">
      <div class="albums-list">
        <div
          v-for="album in albums"
          :key="album.id"
          :class="['album-card', { featured: album.featured }]"
        >
          <div class="album-image">
            <img
              :src="album.image"
              :alt="album.title"
              loading="lazy"
            />
            <div v-if="album.featured" class="featured-badge">⭐ 精选</div>
          </div>

          <div class="album-content">
            <div class="album-content-wrapper">
              <div class="album-header">
                <h3 class="album-title">{{ album.title }}</h3>
                <span class="album-category">{{ album.category }}</span>
              </div>

              <p class="album-description">{{ album.description }}</p>

              <div class="album-tags">
                <span
                  v-for="tag in album.tags"
                  :key="tag"
                  class="tag"
                >
                  {{ tag }}
                </span>
              </div>

              <div class="album-links">
                <a
                  v-if="album.viewUrl"
                  :href="album.viewUrl"
                  target="_blank"
                  class="album-link view"
                >
                  📸 查看相册
                </a>
                <a
                  v-if="album.downloadUrl"
                  :href="album.downloadUrl"
                  target="_blank"
                  class="album-link download"
                >
                  📥 下载原图
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导航 -->
    <div class="navigation">
      <a href="/" class="back-link">← 返回首页</a>
      <a href="/projects" class="next-link">查看项目 →</a>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>正在加载相册...</p>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error">
      <p>❌ 加载失败: {{ error }}</p>
      <button @click="loadAlbums" class="retry-btn">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 相册类型定义
interface Album {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  image: string
  viewUrl?: string
  downloadUrl?: string
  featured: boolean
  createdAt: string
  updatedAt: string
}

// 响应式数据
const albums = ref<Album[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// 图片映射 - 直接使用原图路径
const getImageUrl = (imageName: string): string => {
  // 直接使用原图路径，不使用 Astro 图片处理
  return `/assets/${imageName}`;
};

// 加载相册数据
const loadAlbums = async () => {
  try {
    loading.value = true
    error.value = null
    
    const response = await fetch('/api/albums')
    const apiResponse = await response.json()
    
    if (apiResponse.success) {
      // 处理图片路径
      albums.value = apiResponse.data.albums.map((album: Album) => ({
        ...album,
        image: getImageUrl(album.image)
      }))
    } else {
      throw new Error(apiResponse.message || 'Failed to load albums')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
    console.error('Failed to load albums:', err)
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadAlbums()
})
</script>

<style scoped>
.albums-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.page-header {
  text-align: center;
  margin: 2rem 0 3rem 0;
}

.page-title {
  font-size: 2.5rem;
  color: var(--theme-text);
  margin-bottom: 1rem;
  font-weight: 700;
}

.page-description {
  font-size: 1.1rem;
  color: var(--theme-text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.albums-container {
  margin: 2rem 0;
  width: 100%;
}

.albums-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin: 2rem 0;
  width: 100%;
}

.album-card {
  background: var(--theme-bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: 100%;
  min-height: 300px;
}

.album-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.album-card.featured {
  border: 2px solid var(--theme-accent);
}

.album-image {
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

.album-image img {
  width: 100%;
  height: calc(300px - 3rem);
  object-fit: cover;
  flex-shrink: 0;
  border-radius: 8px;
}

.featured-badge {
  position: absolute;
  top: 1.5rem;
  right: 1rem;
  background: var(--theme-accent);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.album-content {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 75%;
  align-items: flex-start;
  min-height: 300px;
}

.album-content-wrapper {
  width: 100%;
}

.album-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.album-title {
  margin: 0;
  font-size: 1.5rem;
  color: var(--theme-text);
  font-weight: 600;
}

.album-category {
  background: var(--theme-accent);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.album-description {
  color: var(--theme-text-secondary);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.album-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  background: var(--theme-bg-code);
  color: var(--theme-text-code);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: "Fira Code", "Monaco", "Consolas", monospace;
}

.album-links {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.album-link {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: background-color 0.2s;
}

.album-link.view {
  background: var(--theme-accent);
  color: white;
}

.album-link.view:hover {
  background: var(--theme-accent-hover);
}

.album-link.download {
  background: #28a745;
  color: white;
}

.album-link.download:hover {
  background: #218838;
}

.navigation {
  margin: 3rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-link,
.next-link {
  padding: 0.75rem 1.5rem;
  background: var(--theme-accent);
  color: white;
  text-decoration: none;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.back-link:hover,
.next-link:hover {
  background: var(--theme-accent-hover);
}

.loading {
  text-align: center;
  padding: 3rem 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--theme-bg-secondary);
  border-top: 4px solid var(--theme-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 3rem 0;
  color: #dc3545;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--theme-accent);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.retry-btn:hover {
  background: var(--theme-accent-hover);
}

@media (max-width: 768px) {
  .album-card {
    flex-direction: column;
  }

  .album-image {
    width: 100%;
    height: 200px;
  }

  .album-content {
    width: 100%;
  }

  .album-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .album-links {
    flex-direction: column;
  }

  .navigation {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
