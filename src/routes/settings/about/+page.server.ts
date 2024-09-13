import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import fs from 'fs/promises';
import path from 'path';
import { building, dev } from '$app/environment';

export const load: PageServerLoad = async ({ fetch, locals }) => {
    async function getAboutInfo() {
        try {
            const toGet = ['version', 'symlink'];
            const results = await fetch(`${locals.BACKEND_URL}/settings/get/${toGet.join(',')}`);
            return await results.json();
        } catch (e) {
            console.error(e);
            error(503, 'Unable to fetch settings data. API is down.');
        }
    }
    let versionFilePath: string;
    if (!building) {
        if (!dev) {
            versionFilePath = '/riven/version.txt'; 
        } else {
            versionFilePath = './version.txt';
        }
    }
    let frontendVersion = 'Unknown';
    try {
        frontendVersion = (await fs.readFile(path.resolve(versionFilePath), 'utf-8')).trim();
    } catch (err) {
        console.error('Error reading frontend version file:', err);
    }
    return {
        settings: await getAboutInfo(),
        frontendVersion
    };
};
