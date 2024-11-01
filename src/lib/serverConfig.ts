import fs from 'fs/promises';
import path from 'path';

const CONFIG_DIR = path.join(process.cwd(), 'config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'server.json');

interface ServerConfig {
	backendUrl: string;
	apiKey: string;
}

export async function getServerConfig(): Promise<ServerConfig | null> {
	try {
		const data = await fs.readFile(CONFIG_FILE, 'utf-8');
		return JSON.parse(data);
	} catch {
		return null;
	}
}

export async function setServerConfig(config: ServerConfig): Promise<void> {
	try {
		await fs.mkdir(CONFIG_DIR, { recursive: true });
		await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
	} catch (error) {
		console.error('Failed to set server config:', error);
		throw error;
	}
}
