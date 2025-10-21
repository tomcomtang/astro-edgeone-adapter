// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import edgeone from './adapter/src/index.ts';

// https://astro.build/config
export default defineConfig({
	site: 'https://example.com',
	output: 'server', // 启用 SSR 模式，可改为 'static' 或 'hybrid'
	adapter: edgeone({
		outDir: '.edgeone'
	}),
	integrations: [mdx(), sitemap()],
});

// 如果需要记录 hooks 参数，可以使用：
// import hooksLogger from './adapter/hooks-logger.ts';
// integrations: [hooksLogger(), mdx(), sitemap()]
