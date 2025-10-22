# Astro Client 指令演示

这个文档展示了如何在博客项目中使用不同的 client 指令。

## 当前使用的指令

```tsx
// src/pages/blog/index.astro
<BlogCarousel posts={posts} client:visible />
```

我们使用 `client:visible` 因为：

- ✅ 轮播图在首屏下方，需要滚动才能看到
- ✅ 不影响首屏性能（LCP）
- ✅ 进入视口时自动加载和激活

## 其他指令示例

### 1. client:idle - 搜索框

```tsx
// 适合非关键交互组件，在浏览器空闲时加载
<SearchBar client:idle />
```

### 2. client:load - 关键功能

```tsx
// 立即需要的交互功能
<ShoppingCart client:load />
<AuthModal client:load />
```

### 3. client:media - 响应式组件

```tsx
// 移动端显示汉堡菜单
<MobileMenu client:media="(max-width: 768px)" />

// 桌面端显示完整侧边栏
<Sidebar client:media="(min-width: 769px)" />
```

### 4. client:only - 仅客户端

```tsx
// 无法 SSR 的组件（如依赖 window 的图表库）
<Chart client:only="react" />
<MapComponent client:only="react" />
```

### 5. 无指令 - 纯静态

```tsx
// 不需要交互的组件，仅输出 HTML
<BlogCard post={post} />
<StaticContent />
```

## 性能最佳实践

### ✅ 推荐做法

```tsx
// 首屏保持静态
<Header />
<HeroSection />

// 非关键交互用 idle
<SearchBar client:idle />

// 折叠下方用 visible
<BlogCarousel client:visible />
<Comments client:visible />
<RelatedPosts client:visible />

// 页脚保持静态
<Footer />
```

### ❌ 避免过度 hydration

```tsx
// 不好：所有组件都用 client:load
<Header client:load />  ❌
<HeroSection client:load />  ❌
<BlogList client:load />  ❌
<Footer client:load />  ❌

// 好：只在需要交互时使用
<Header />  ✅
<HeroSection />  ✅
<InteractiveBlogList client:idle />  ✅
<Footer />  ✅
```

## 调试技巧

打开浏览器开发者工具 Network 面板，观察：

1. **client:load** - 页面加载时立即下载 JS
2. **client:idle** - 页面加载后 1-2 秒下载 JS
3. **client:visible** - 滚动到组件时才下载 JS
4. **client:media** - 匹配媒体查询时下载 JS
5. **无指令** - 不下载任何组件 JS

## 更多资源

- [Astro 官方文档](https://docs.astro.build/en/reference/directives-reference/#client-directives)
- [Islands 架构](https://docs.astro.build/en/concepts/islands/)
