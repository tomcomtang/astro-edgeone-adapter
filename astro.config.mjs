// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import edgeone from './adapter/src/index.ts';

// https://astro.build/config
export default defineConfig({
	site: 'https://astro-edgeone-adapter.edgeone.run/', // 必需：用于生成 canonical URLs
	output: 'server', // SSR 模式
	adapter: edgeone({
		outDir: '.edgeone'
	}),
	integrations: [mdx(), sitemap(), react()],
});

// 如果需要记录 hooks 参数，可以使用：
// import hooksLogger from './adapter/hooks-logger.ts';
// integrations: [hooksLogger(), mdx(), sitemap()]
