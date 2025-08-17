import { mdsvex } from "mdsvex";
import adapter from "@sveltejs/adapter-node";
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
    }
};

export default config;
