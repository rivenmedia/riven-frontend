import { dev } from "$app/environment";
import type { Schema } from "@sjsf/form";

/**
 * Log a warning in development mode only.
 * Helps catch schema mismatches without affecting production.
 */
function devWarn(message: string, ...args: unknown[]): void {
    if (dev) {
        console.warn(`[settings-schema] ${message}`, ...args);
    }
}

/**
 * Resolve a $ref pointer to its actual schema definition.
 * Handles JSON Schema $ref like "#/$defs/UpdatersModel".
 */
export function resolveRef(rootSchema: Schema, ref: string): Schema | undefined {
    if (!ref.startsWith("#/")) {
        devWarn(`Unsupported $ref format: ${ref}`);
        return undefined;
    }

    const path = ref.slice(2).split("/"); // Remove "#/" and split
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

/**
 * Get the resolved schema for a property, following $ref if present.
 * Merges description from the property with the referenced schema.
 */
function resolveProperty(rootSchema: Schema, propSchema: Schema): Schema {
    const ref = propSchema.$ref as string | undefined;
    if (!ref) {
        return propSchema;
    }

    const resolved = resolveRef(rootSchema, ref);
    if (!resolved) {
        return propSchema;
    }

    // Merge: property-level description takes precedence, then use resolved schema
    return {
        ...resolved,
        description: propSchema.description || resolved.description
    };
}

/**
 * Get schema fragment at a dot-separated path, resolving $ref references.
 * e.g., getSchemaAtPath(schema, "updaters.plex") returns the plex service schema
 */
export function getSchemaAtPath(rootSchema: Schema, path: string): Schema | undefined {
    const parts = path.split(".");
    let current: Schema | undefined = rootSchema;

    for (const part of parts) {
        if (!current || typeof current !== "object") {
            devWarn(`Path "${path}" failed at "${part}": current schema is not an object`);
            return undefined;
        }

        // Resolve $ref if present on current schema
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

        // Resolve $ref on the property we just found
        current = resolveProperty(rootSchema, propSchema);
    }

    return current;
}

/**
 * Format a snake_case or camelCase key into a human-readable title.
 * e.g., "real_debrid" -> "Real Debrid", "apiKey" -> "Api Key"
 */
export function formatKey(key: string): string {
    return key
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Get fields for a service from the schema, excluding the "enabled" field.
 * Used by section components to render service configuration fields.
 */
export function getServiceFields(schema: Schema, servicePath: string): string[] {
    const serviceSchema = getSchemaAtPath(schema, servicePath);
    if (!serviceSchema?.properties) return [];

    const props = serviceSchema.properties as Record<string, unknown>;
    return Object.keys(props).filter((key) => key !== "enabled");
}

/**
 * Get the description for a service from the schema.
 */
export function getServiceDescription(schema: Schema, servicePath: string): string | undefined {
    const serviceSchema = getSchemaAtPath(schema, servicePath);
    return serviceSchema?.description as string | undefined;
}

/**
 * Service info returned by getServicesFromSchema
 */
export interface ServiceInfo {
    key: string;
    title: string;
}

/**
 * Get all services from a section of the schema.
 * A "service" is an object property that has an "enabled" boolean field.
 */
export function getServicesFromSchema(schema: Schema, section: string): ServiceInfo[] {
    const sectionSchema = getSchemaAtPath(schema, section);
    if (!sectionSchema?.properties) return [];

    const props = sectionSchema.properties as Record<string, Schema>;
    const services: ServiceInfo[] = [];

    for (const [key, propSchema] of Object.entries(props)) {
        const resolved = propSchema.$ref
            ? getSchemaAtPath(schema, `${section}.${key}`)
            : propSchema;
        if (!resolved?.properties) continue;

        const resolvedProps = resolved.properties as Record<string, Schema>;
        if (resolvedProps.enabled) {
            services.push({
                key,
                title: (resolved.title as string) || formatKey(key)
            });
        }
    }

    return services;
}
