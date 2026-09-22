import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/sveltekit";

const envDynamicPublicStub = fileURLToPath(
  new URL("./env-dynamic-public-stub.ts", import.meta.url),
);
const libraryRemoteStub = fileURLToPath(
  new URL("./library-remote-stub.ts", import.meta.url),
);

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|ts|svelte)"],
  addons: [
    "@storybook/addon-svelte-csf",
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp",
    "msw-storybook-addon",
  ],
  staticDirs: ["../static"],
  framework: "@storybook/sveltekit",
  async viteFinal(viteConfig) {
    viteConfig.resolve ??= {};
    viteConfig.resolve.alias = {
      ...viteConfig.resolve.alias,
      "$env/dynamic/public": envDynamicPublicStub,
      "./library.remote": libraryRemoteStub,
    };
    return viteConfig;
  },
};
export default config;
