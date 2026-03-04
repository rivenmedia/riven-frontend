# Frontend dependency updates (compatibility check)

## Intentionally not updated (require separate migration or have breaking changes)

| Package                  | Current | Latest | Reason                                                                                                                                              |
| ------------------------ | ------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **eslint**               | ^9.39.2 | 10.0.2 | ESLint 10 requires Node 20.19+, removes legacy config (we use flat config), and has new default rules; plugins may need compatibility verification. |
| **@eslint/js**           | ^9.39.2 | 10.0.1 | Must stay aligned with ESLint 9 when not migrating to ESLint 10.                                                                                    |
| **better-auth**          | ^1.4.13 | 1.5.0  | v1.5 replaces `@better-auth/cli` with `npx auth`; script `ba:generate` uses the old CLI.                                                            |
| **@better-auth/passkey** | ^1.4.13 | 1.5.0  | Keep aligned with better-auth 1.4.x.                                                                                                                |

## Updated in this pass (compatible minor/patch)

- **Svelte / Kit / Vite stack**: No change (already on Svelte 5, SvelteKit 2, Vite 7).
- **Tailwind**: 4.1.18 → 4.2.1 (and @tailwindcss/vite).
- **SJSF**: All @sjsf/\* 3.2.1 → 3.3.0 (form, sveltekit, shadcn4-theme, lucide-icons, ajv8-validator).
- **bits-ui**, **svelte-check**, **sveltekit-superforms**, **typescript-eslint**, **drizzle-kit**, **@sveltejs/adapter-node**, **@lucide/svelte**, and other dev deps: updated to latest within compatible range.
- **openapi-fetch**: 0.15 → 0.17 (minor; if API usage breaks, pin back to ^0.15.0).

After `pnpm install`, run `pnpm run build` to confirm. **trakt.ts:** The generated file has `// @ts-nocheck` because the Trakt OpenAPI spec has duplicate operation names (e.g. "Get shows"); after regenerating with the script in `scripts/trakt-b2s.ts`, re-add that line.
