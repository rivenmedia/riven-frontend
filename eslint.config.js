import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		},
		rules: {
			'no-console': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_'
				}
			],
			'svelte/no-target-blank': 'error',
			'svelte/no-immutable-reactive-statements': 'error',
			'svelte/prefer-style-directive': 'error',
			'svelte/no-reactive-literals': 'error',
			'svelte/no-useless-mustaches': 'error',
			'svelte/button-has-type': 'off',
			'svelte/require-each-key': 'off',
			'svelte/no-at-html-tags': 'off',
			'svelte/no-unused-svelte-ignore': 'off',
			'svelte/require-stores-init': 'off'
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/', 'src/lib/components/ui/', '.idea/', 'src/client/']
	}
];
