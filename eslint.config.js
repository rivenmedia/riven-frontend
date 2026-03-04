import prettier from "eslint-config-prettier";
import js from "@eslint/js";
import { includeIgnoreFile } from "@eslint/compat";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import { fileURLToPath } from "node:url";
import ts from "typescript-eslint";
import svelteConfig from "./svelte.config.js";

const gitignorePath = fileURLToPath(new URL("./.gitignore", import.meta.url));

export default ts.config(
    includeIgnoreFile(gitignorePath),
    { ignores: ["src/lib/api/**", "src/lib/components/ui/**"] },
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs.recommended,
    prettier,
    ...svelte.configs.prettier,
    {
        languageOptions: {
            globals: { ...globals.browser, ...globals.node }
        },
        rules: {
            "no-undef": "off",
            "@typescript-eslint/no-unused-vars": "warn",
            "svelte/no-navigation-without-resolve": "warn",
            "@typescript-eslint/no-explicit-any": "warn",
            "svelte/no-unnecessary-state-wrap": "warn",
            "@typescript-eslint/ban-ts-comment": "warn",
            "svelte/require-each-key": "warn",
            "svelte/prefer-svelte-reactivity": "warn",
            "svelte/prefer-writable-derived": "warn",
            "svelte/no-unused-svelte-ignore": "warn"
        }
    },
    {
        files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                extraFileExtensions: [".svelte"],
                parser: ts.parser,
                svelteConfig
            }
        }
    }
);
