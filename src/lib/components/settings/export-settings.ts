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

/**
 * Determines whether a property key name is considered sensitive.
 *
 * @param key - The property name to evaluate
 * @returns `true` if the key matches any known sensitive key pattern (for example `api_key`, `token`, `password`, `secret`), `false` otherwise.
 */
function isSensitiveKey(key: string): boolean {
    return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Determines whether a string looks like a connection string that contains embedded credentials.
 *
 * @param value - The string to inspect for embedded credentials (e.g., `scheme://user:pass@host`)
 * @returns `true` if the string matches the connection-string pattern, `false` otherwise.
 */
function isSensitiveValue(value: string): boolean {
    return CONNECTION_STRING_PATTERN.test(value);
}

/**
 * Recursively redacts sensitive string values within the given value while preserving structure.
 *
 * @param obj - The value to obfuscate; may be an object, array, or primitive. Null and undefined are returned unchanged.
 * @param parentKey - Optional recursion path used internally to track the key context (not required for callers).
 * @returns The obfuscated value with the same shape as `obj` where any string determined to be sensitive is replaced with `redacted-{key}`; arrays and non-string values are preserved and processed recursively.
 */
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

/**
 * Obfuscates sensitive fields in a settings object and triggers a browser download of the resulting JSON file.
 *
 * @param settings - The settings data to obfuscate and serialize for export.
 * @param filename - The filename to use for the downloaded JSON (defaults to "riven-settings.json").
 */
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