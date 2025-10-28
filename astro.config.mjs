// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';
import edgeone from './adapter/src/index.ts';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
    site: 'https://astro-edgeone-adapter.edgeone.run/', // 必需：用于生成 canonical URLs
    output: 'server', // SSR 模式
    adapter: edgeone({
        outDir: '.edgeone',
        // 手动指定要包含的文件
        includeFiles: ['include-file/in.txt'],
        // 排除不需要的依赖文件
        excludeFiles: ['node_modules/.cache/**'],
    }),
    
    // Vite 配置 - 自动包含这些类型的文件
    vite: {
        assetsInclude: [
            '**/*.txt'
        ],
    },
    
    integrations: [mdx(), sitemap(), react(), vue(), svelte()]
});