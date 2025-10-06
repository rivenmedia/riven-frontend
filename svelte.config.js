import { mdsvex } from "mdsvex";
import adapter from 'svelte-adapter-bun';
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const config = {
    preprocess: [vitePreprocess(), mdsvex()],
    kit: {
        adapter: adapter(),
        experimental: {
            remoteFunctions: true
        }
    },
    extensions: [".svelte", ".svx"],
    compilerOptions: {
        experimental: {
            async: true
        }
    },
    vitePlugin: {
        inspector: true
    }
};

export default config;
