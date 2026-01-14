import { dev } from "$app/environment";
import type { Schema } from "@sjsf/form";

function devWarn(message: string, ...args: unknown[]): void {
    if (dev) {
        console.warn(`[settings-schema] ${message}`, ...args);
    }
}

/** Resolve a JSON Schema $ref pointer (e.g., "#/$defs/UpdatersModel") to its definition. */
export function resolveRef(rootSchema: Schema, ref: string): Schema | undefined {
    if (!ref.startsWith("#/")) {
        devWarn(`Unsupported $ref format: ${ref}`);
        return undefined;
    }

    const path = ref.slice(2).split("/");
    let current: unknown = rootSchema;

    for (const part of path) {
        if (!current || typeof current !== "object") {
            devWarn(`Failed to resolve $ref "${ref}" at "${part}"`);
            return undefined;
        }
        current = (current as Record<string, unknown>)[part];
    }

    return current as Schema | undefined;
}

/** Resolve a property's $ref if present, merging description from the property. */
function resolveProperty(rootSchema: Schema, propSchema: Schema): Schema {
    const ref = propSchema.$ref as string | undefined;
    if (!ref) return propSchema;

    const resolved = resolveRef(rootSchema, ref);
    if (!resolved) return propSchema;

    return {
        ...resolved,
        description: propSchema.description || resolved.description
    };
}

/** Get schema at a dot-separated path (e.g., "updaters.plex"), resolving $refs. */
export function getSchemaAtPath(rootSchema: Schema, path: string): Schema | undefined {
    const parts = path.split(".");
    let current: Schema | undefined = rootSchema;

    for (const part of parts) {
        if (!current || typeof current !== "object") {
            devWarn(`Path "${path}" failed at "${part}": current schema is not an object`);
            return undefined;
        }

        current = resolveProperty(rootSchema, current);

        const props = current.properties as Record<string, Schema> | undefined;
        if (!props) {
            devWarn(`Path "${path}" failed at "${part}": no properties found`);
            return undefined;
        }

        const propSchema = props[part];
        if (!propSchema) {
            devWarn(
                `Path "${path}" failed: property "${part}" not found. Available: ${Object.keys(props).join(", ")}`
            );
            return undefined;
        }

        current = resolveProperty(rootSchema, propSchema);
    }

    return current;
}

/** Format a snake_case or camelCase key into a title (e.g., "real_debrid" -> "Real Debrid"). */
export function formatKey(key: string): string {
    return key
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}
