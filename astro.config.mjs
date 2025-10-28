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
        outDir: '.edgeone'
    }),
    integrations: [mdx(), sitemap(), react(), vue(), svelte()],
});