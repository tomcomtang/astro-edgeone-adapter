# EdgeOne 部署调试指南

## 🔍 404 响应的三种类型

### 类型 1：纯文本 "Not Found"
```
Not Found
```
**来源：** EdgeOne 网关层
**说明：** meta.json 中的路由配置有问题，或者部署配置不正确

---

### 类型 2：JSON - 路由未匹配
```json
{
  "error": "[EdgeOne Router] Route Not Found - 404",
  "message": "The requested path does not match any route in Astro",
  "debug": "This 404 comes from index.mjs handleResponse"
}
```
**来源：** server-handler/index.mjs
**说明：** 请求到达了 server-handler，但 Astro 没有匹配到路由

---

### 类型 3：JSON - 图片 fetch 失败
```json
{
  "error": "Image Origin Fetch Failed - 404",
  "message": "Failed to fetch original image from source",
  "sourceUrl": "https://...",
  "debug": "[EdgeOne Image Optimization] Original image not found or fetch failed"
}
```
**来源：** server-handler/pages/_image.astro.mjs
**说明：** _image 被调用了，但无法获取原图

---

## 🧪 测试步骤

### 1. 测试首页
```
https://astro-edgeone-adapter-jqdueo4zoc.edgeone.run/
```
- ✅ 正常 → server-handler 工作正常
- ❌ 404 → 整个 server-handler 没启动或配置错误

### 2. 测试静态图片
```
https://astro-edgeone-adapter-jqdueo4zoc.edgeone.run/_astro/blog-placeholder-1.Bx0Zcyzv.jpg
```
- ✅ 正常 → 静态资源可访问
- ❌ 404 → assets 目录配置问题

### 3. 测试 _image 端点
```
https://astro-edgeone-adapter-jqdueo4zoc.edgeone.run/_image?href=%2F_astro%2Fblog-placeholder-1.Bx0Zcyzv.jpg&w=400&f=webp
```
查看返回内容类型！

---

## 📊 诊断表

| 首页 | 静态图片 | _image | 404 类型 | 问题 | 解决方案 |
|-----|---------|--------|---------|------|---------|
| ❌ | ❌ | ❌ | 纯文本 | server-handler 未启动 | 检查部署配置 |
| ✅ | ❌ | ❌ | 纯文本 | assets 路由问题 | 检查 assets 配置 |
| ✅ | ✅ | 纯文本 | 纯文本 | meta.json 路由缺失 | 检查 nextRoutes |
| ✅ | ✅ | JSON 类型2 | JSON | Astro 路由问题 | 检查 entry.mjs |
| ✅ | ✅ | JSON 类型3 | JSON | fetch 失败 | 网络限制 |

---

## 🔧 可能的解决方案

### 如果是纯文本 "Not Found"

1. **检查部署文件是否完整**
   ```
   .edgeone/
   ├── meta.json          ← 检查是否存在
   ├── project.json       ← 检查是否存在
   ├── assets/            ← 检查是否存在
   └── server-handler/    ← 检查是否存在
   ```

2. **检查 meta.json 内容**
   ```bash
   cat .edgeone/meta.json
   # 确认包含：{ "path": "/_image" }
   ```

3. **检查 EdgeOne 控制台**
   - 函数是否部署成功
   - 路由配置是否正确
   - 日志中是否有错误

### 如果是 JSON 响应

直接查看 JSON 内容中的 `debug` 字段，就知道问题在哪里了。

---

## 💡 快速验证

运行以下命令：
```bash
# 测试首页
curl https://astro-edgeone-adapter-jqdueo4zoc.edgeone.run/

# 测试静态图片
curl https://astro-edgeone-adapter-jqdueo4zoc.edgeone.run/_astro/blog-placeholder-1.Bx0Zcyzv.jpg

# 测试 _image（查看完整响应）
curl -v "https://astro-edgeone-adapter-jqdueo4zoc.edgeone.run/_image?href=%2F_astro%2Fblog-placeholder-1.Bx0Zcyzv.jpg&w=400&f=webp"
```

把三个命令的输出告诉我！
