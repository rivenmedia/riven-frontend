
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const ZPLUG_ERROR_LOG: string;
	export const SSH_CLIENT: string;
	export const USER: string;
	export const ZPLUG_LOG_LOAD_FAILURE: string;
	export const npm_config_user_agent: string;
	export const ZPLUG_THREADS: string;
	export const XDG_SESSION_TYPE: string;
	export const TURBO_UI: string;
	export const FZF_DEFAULT_OPTS: string;
	export const FZF_CTRL_T_COMMAND: string;
	export const GIT_ASKPASS: string;
	export const npm_node_execpath: string;
	export const SHLVL: string;
	export const BROWSER: string;
	export const HOME: string;
	export const OLDPWD: string;
	export const LESS: string;
	export const NVM_BIN: string;
	export const TERM_PROGRAM_VERSION: string;
	export const VSCODE_IPC_HOOK_CLI: string;
	export const npm_package_json: string;
	export const ZSH: string;
	export const LSCOLORS: string;
	export const ZNT_CONFIG_DIR: string;
	export const NVM_INC: string;
	export const COREPACK_ROOT: string;
	export const HOMEBREW_PREFIX: string;
	export const FPATH: string;
	export const ZPLUG_BIN: string;
	export const PAGER: string;
	export const NODE_OPTIONS: string;
	export const VSCODE_GIT_ASKPASS_MAIN: string;
	export const _ZPLUG_VERSION: string;
	export const VSCODE_GIT_ASKPASS_NODE: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const ZPLUG_HOME: string;
	export const VSCODE_PYTHON_AUTOACTIVATE_GUARD: string;
	export const ZPLUG_FILTER: string;
	export const FZF_BASE: string;
	export const COLORTERM: string;
	export const NVM_DIR: string;
	export const INFOPATH: string;
	export const COREPACK_ENABLE_DOWNLOAD_PROMPT: string;
	export const LOGNAME: string;
	export const PERIOD: string;
	export const _ZPLUG_URL: string;
	export const pnpm_config_verify_deps_before_run: string;
	export const _: string;
	export const XDG_SESSION_CLASS: string;
	export const ZPLUG_LOADFILE: string;
	export const CLAUDE_CODE_SSE_PORT: string;
	export const USER_ZDOTDIR: string;
	export const XDG_SESSION_ID: string;
	export const _ZPLUG_CONFIG_SUBSHELL: string;
	export const TERM: string;
	export const ZPLUG_LOG_LOAD_SUCCESS: string;
	export const OP_PLUGIN_ALIASES_SOURCED: string;
	export const npm_config_node_gyp: string;
	export const PATH: string;
	export const HOMEBREW_CELLAR: string;
	export const ZPLUG_CACHE_DIR: string;
	export const npm_package_name: string;
	export const NODE: string;
	export const XDG_RUNTIME_DIR: string;
	export const _ZPLUG_OHMYZSH: string;
	export const _ZPLUG_PREZTO: string;
	export const LANG: string;
	export const VSCODE_INJECTION: string;
	export const LS_COLORS: string;
	export const TERM_PROGRAM: string;
	export const VSCODE_GIT_IPC_HANDLE: string;
	export const npm_lifecycle_script: string;
	export const SSH_AUTH_SOCK: string;
	export const SHELL: string;
	export const _ZPLUG_AWKPATH: string;
	export const npm_package_version: string;
	export const npm_lifecycle_event: string;
	export const NODE_PATH: string;
	export const ZPLUG_PROTOCOL: string;
	export const ZPLUG_REPOS: string;
	export const VSCODE_INSPECTOR_OPTIONS: string;
	export const VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
	export const PWD: string;
	export const FZF_DEFAULT_COMMAND: string;
	export const npm_execpath: string;
	export const SSH_CONNECTION: string;
	export const NVM_CD_FLAGS: string;
	export const COPILOT_DEBUG_NONCE: string;
	export const ZDOTDIR: string;
	export const HOMEBREW_REPOSITORY: string;
	export const ZPLUG_USE_CACHE: string;
	export const npm_command: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const ZNT_REPO_DIR: string;
	export const PNPM_HOME: string;
	export const ZPLUG_ROOT: string;
	export const INIT_CWD: string;
	export const NODE_ENV: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		ZPLUG_ERROR_LOG: string;
		SSH_CLIENT: string;
		USER: string;
		ZPLUG_LOG_LOAD_FAILURE: string;
		npm_config_user_agent: string;
		ZPLUG_THREADS: string;
		XDG_SESSION_TYPE: string;
		TURBO_UI: string;
		FZF_DEFAULT_OPTS: string;
		FZF_CTRL_T_COMMAND: string;
		GIT_ASKPASS: string;
		npm_node_execpath: string;
		SHLVL: string;
		BROWSER: string;
		HOME: string;
		OLDPWD: string;
		LESS: string;
		NVM_BIN: string;
		TERM_PROGRAM_VERSION: string;
		VSCODE_IPC_HOOK_CLI: string;
		npm_package_json: string;
		ZSH: string;
		LSCOLORS: string;
		ZNT_CONFIG_DIR: string;
		NVM_INC: string;
		COREPACK_ROOT: string;
		HOMEBREW_PREFIX: string;
		FPATH: string;
		ZPLUG_BIN: string;
		PAGER: string;
		NODE_OPTIONS: string;
		VSCODE_GIT_ASKPASS_MAIN: string;
		_ZPLUG_VERSION: string;
		VSCODE_GIT_ASKPASS_NODE: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		ZPLUG_HOME: string;
		VSCODE_PYTHON_AUTOACTIVATE_GUARD: string;
		ZPLUG_FILTER: string;
		FZF_BASE: string;
		COLORTERM: string;
		NVM_DIR: string;
		INFOPATH: string;
		COREPACK_ENABLE_DOWNLOAD_PROMPT: string;
		LOGNAME: string;
		PERIOD: string;
		_ZPLUG_URL: string;
		pnpm_config_verify_deps_before_run: string;
		_: string;
		XDG_SESSION_CLASS: string;
		ZPLUG_LOADFILE: string;
		CLAUDE_CODE_SSE_PORT: string;
		USER_ZDOTDIR: string;
		XDG_SESSION_ID: string;
		_ZPLUG_CONFIG_SUBSHELL: string;
		TERM: string;
		ZPLUG_LOG_LOAD_SUCCESS: string;
		OP_PLUGIN_ALIASES_SOURCED: string;
		npm_config_node_gyp: string;
		PATH: string;
		HOMEBREW_CELLAR: string;
		ZPLUG_CACHE_DIR: string;
		npm_package_name: string;
		NODE: string;
		XDG_RUNTIME_DIR: string;
		_ZPLUG_OHMYZSH: string;
		_ZPLUG_PREZTO: string;
		LANG: string;
		VSCODE_INJECTION: string;
		LS_COLORS: string;
		TERM_PROGRAM: string;
		VSCODE_GIT_IPC_HANDLE: string;
		npm_lifecycle_script: string;
		SSH_AUTH_SOCK: string;
		SHELL: string;
		_ZPLUG_AWKPATH: string;
		npm_package_version: string;
		npm_lifecycle_event: string;
		NODE_PATH: string;
		ZPLUG_PROTOCOL: string;
		ZPLUG_REPOS: string;
		VSCODE_INSPECTOR_OPTIONS: string;
		VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
		PWD: string;
		FZF_DEFAULT_COMMAND: string;
		npm_execpath: string;
		SSH_CONNECTION: string;
		NVM_CD_FLAGS: string;
		COPILOT_DEBUG_NONCE: string;
		ZDOTDIR: string;
		HOMEBREW_REPOSITORY: string;
		ZPLUG_USE_CACHE: string;
		npm_command: string;
		PNPM_SCRIPT_SRC_DIR: string;
		ZNT_REPO_DIR: string;
		PNPM_HOME: string;
		ZPLUG_ROOT: string;
		INIT_CWD: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
