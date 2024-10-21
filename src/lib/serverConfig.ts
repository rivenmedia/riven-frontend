import fs from 'fs/promises';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'server-config.json');

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
	await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}
