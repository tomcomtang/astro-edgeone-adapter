// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import edgeoneAdapter from './adapter/src/index.ts';
// import edgeoneAdapter from '@tencent/edgeone-astro-adapter';

// https://astro.build/config
export default defineConfig({
    site: 'https://astro-edgeone-adapter.edgeone.run/', // 必需：用于生成 canonical URLs
    output: 'server', // server 模式
    // adapter: vercelAdapter(),
    adapter: edgeoneAdapter(),
    integrations: [mdx(), sitemap(), react(), vue(), svelte()],
    // trailingSlash: 'ignore',
    // outDir: 'build',
    // redirects: {
    //     '/albums-old': '/albums',
    //     '/projects-old': {
    //         status: 302,
    //         destination: '/projects'
    //     }
    // }
    // build: {
    //     // client: './static-files',
    //     // server: './server-files',
    //     // assets: '_js_and_css',
    //     serverEntry: 'main.mjs'
    // },
    // compressHTML: true
});