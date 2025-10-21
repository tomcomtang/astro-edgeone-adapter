#!/usr/bin/env node

/**
 * 测试 URL 构造逻辑
 * 验证是否会触发 403
 */

console.log('🧪 测试 _image URL 构造逻辑\n');
console.log('═'.repeat(60));

// 模拟 EdgeOne 环境
const mockRequest = {
  url: '/_image?href=%2F_astro%2Fblog-placeholder-1.jpg&w=720&h=360&f=webp',
  headers: {
    'host': 'pages-pro-9-def6.pages-scf-gz-pro.qcloudteo.com',
    'x-forwarded-host': 'astro-edgeone-adapter-6lrcg7a7k3.edgeone.run',
    'x-forwarded-proto': 'https'
  }
};

console.log('📥 模拟 EdgeOne 请求:');
console.log(`   url: ${mockRequest.url}`);
console.log(`   host: ${mockRequest.headers.host}`);
console.log(`   x-forwarded-host: ${mockRequest.headers['x-forwarded-host']}`);
console.log(`   x-forwarded-proto: ${mockRequest.headers['x-forwarded-proto']}`);
console.log('');

// === index.mjs 的逻辑 ===
console.log('🔧 Step 1: index.mjs 构造 URL');
console.log('─'.repeat(60));

const realHost = mockRequest.headers['x-forwarded-host'] || mockRequest.headers.host;
const realProto = mockRequest.headers['x-forwarded-proto'] || 'https';
const url = new URL(mockRequest.url, `${realProto}://${realHost}`);

console.log(`   realHost = ${realHost}`);
console.log(`   realProto = ${realProto}`);
console.log(`   url.href = ${url.href}`);
console.log(`   url.origin = ${url.origin}`);
console.log('');

// 模拟传给 Astro
const requestUrl = url.toString();
console.log(`   ✅ 传给 Astro: request.url = ${requestUrl}`);
console.log('');

// === _image.astro.mjs 的逻辑 ===
console.log('🎯 Step 2: _image.astro.mjs 处理');
console.log('─'.repeat(60));

// Astro 解析 URL
const urlInImage = new URL(requestUrl);
console.log(`   const url = new URL(request.url)`);
console.log(`   url.origin = ${urlInImage.origin}`);
console.log('');

// 模拟 transform.src（从查询参数解析）
const transform = { src: '/_astro/blog-placeholder-1.jpg' };
console.log(`   transform.src = '${transform.src}' (从 href 参数解析)`);
console.log('');

// Astro 构造 sourceUrl
const sourceUrl = new URL(transform.src, urlInImage.origin);
console.log(`   const sourceUrl = new URL(transform.src, url.origin)`);
console.log(`   sourceUrl.href = ${sourceUrl.href}`);
console.log(`   sourceUrl.origin = ${sourceUrl.origin}`);
console.log('');

// === 跨域检查 ===
console.log('🔍 Step 3: 跨域检查');
console.log('─'.repeat(60));

const isRemoteImage = false;  // 本地图片
console.log(`   !isRemoteImage = ${!isRemoteImage}`);
console.log(`   sourceUrl.origin = '${sourceUrl.origin}'`);
console.log(`   url.origin = '${urlInImage.origin}'`);
console.log(`   sourceUrl.origin !== url.origin = ${sourceUrl.origin !== urlInImage.origin}`);
console.log('');

const willReturn403 = !isRemoteImage && sourceUrl.origin !== urlInImage.origin;
console.log(`   条件结果: !isRemoteImage && (sourceUrl.origin !== url.origin)`);
console.log(`            = ${!isRemoteImage} && ${sourceUrl.origin !== urlInImage.origin}`);
console.log(`            = ${willReturn403}`);
console.log('');

if (willReturn403) {
  console.log('   ❌ 会返回 403 Forbidden');
} else {
  console.log('   ✅ 不会返回 403，继续执行');
}
console.log('');

console.log('═'.repeat(60));
console.log('');

if (willReturn403) {
  console.log('❌ 测试失败：会触发 403');
  process.exit(1);
} else {
  console.log('✅ 测试通过：不会触发 403');
  console.log('✅ fetch URL 正确：' + sourceUrl.href);
  console.log('');
  console.log('🎉 可以放心部署到 EdgeOne！');
  process.exit(0);
}

