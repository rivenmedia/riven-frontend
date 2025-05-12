import { json } from '@sveltejs/kit';
import type { WebAppManifest } from 'web-app-manifest';
import type { RequestHandler } from '@sveltejs/kit';

export const prerender = true;

interface CustomWebAppManifest extends WebAppManifest {
	protocol_handlers: Array<{ protocol: string; url: string }>;
	id: string; // https://developer.chrome.com/blog/pwa-manifest-id/?utm_source=devtools
}

const manifest: CustomWebAppManifest = {
	theme_color: '#ffffff',
	background_color: '#ffffff',
	display: 'standalone',
	scope: '/',
	start_url: '/',
	id: '/',
	name: 'Riven',
	short_name: 'Riven',
	description: 'Handle your Media Library with ease!',
	orientation: 'portrait',
	categories: ['entertainment', 'utilities'], // https://github.com/w3c/manifest/wiki/Categories,
	screenshots: [
		{
			src: '/screenshots/homepage.png',
			sizes: '2346x1346',
			type: 'image/png',
			// @ts-ignore
			form_factor: 'wide'
		},
		{
			src: '/screenshots/homepage-mobile.png',
			sizes: '810x1080',
			type: 'image/png'
		}
	],
	shortcuts: [
		{
			name: 'Browse',
			url: '/browse',
			icons: [{ src: '/shortcuts/globe.png', sizes: '192x192' }]
		},
		{
			name: 'Summary',
			url: '/summary',
			icons: [{ src: '/shortcuts/library.png', sizes: '192x192' }]
		},
		{
			name: 'Settings',
			url: '/settings',
			icons: [{ src: '/shortcuts/settings.png', sizes: '192x192' }]
		}
	],
	icons: [
		{
			src: '/android-chrome-192x192.png',
			sizes: '192x192',
			type: 'image/png'
		},
		{
			src: '/android-chrome-512x512.png',
			sizes: '512x512',
			type: 'image/png'
		}
	],
	protocol_handlers: [
		{
			protocol: 'web+riven',
			url: '/'
		}
	]
};

export const GET: RequestHandler = async () => {
	return json(manifest, {
		headers: {
			'content-type': 'application/manifest+json'
		}
	});
};
