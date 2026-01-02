const SENSITIVE_KEY_PATTERNS = [
    /api[_-]?key/i,
    /token/i,
    /secret/i,
    /password/i,
    /credential/i,
    /auth/i,
    /private/i,
    /bearer/i,
    /[_-]?key$/i, // Matches camelCase (apiKey, privateKey) and snake_case (api_key)
    /^rss$/i // RSS feeds can contain auth tokens
];

// Matches connection strings with embedded credentials: scheme://user:password@host
const CONNECTION_STRING_PATTERN = /^[a-z][a-z0-9+.-]*:\/\/[^:]+:[^@]+@/i;

function isSensitiveKey(key: string): boolean {
    return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function isSensitiveValue(value: string): boolean {
    return CONNECTION_STRING_PATTERN.test(value);
}

function obfuscateObject(obj: unknown, parentKey = ""): unknown {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item, index) => obfuscateObject(item, `${parentKey}[${index}]`));
    }

    if (typeof obj === "object") {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === "string" && value.length > 0) {
                if (isSensitiveKey(key) || isSensitiveValue(value)) {
                    result[key] = `redacted-${key}`;
                } else {
                    result[key] = value;
                }
            } else {
                result[key] = obfuscateObject(value, key);
            }
        }
        return result;
    }

    return obj;
}

export function exportSettings(settings: unknown, filename = "riven-settings.json"): void {
    const obfuscated = obfuscateObject(settings);
    const json = JSON.stringify(obfuscated, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
