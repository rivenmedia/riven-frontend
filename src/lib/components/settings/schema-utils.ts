import { dev } from "$app/environment";
import type { Schema } from "@sjsf/form";

/**
 * Emit a console warning when running in development builds; no-op in production.
 *
 * @param message - The warning message to log
 * @param args - Additional values to include with the message
 */
function devWarn(message: string, ...args: unknown[]): void {
    if (dev) {
        console.warn(`[settings-schema] ${message}`, ...args);
    }
}

/**
 * Resolve a JSON Schema $ref that starts with "#/" to the referenced schema within the root schema.
 *
 * If `ref` does not start with "#/" or a path segment cannot be traversed, a development warning is emitted and the function returns `undefined`.
 *
 * @param rootSchema - The root schema object to resolve the reference against
 * @param ref - A JSON Pointer-style reference beginning with "#/" (e.g. "#/$defs/UpdatersModel")
 * @returns The resolved schema object, or `undefined` if the reference cannot be resolved
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
 * Resolve a property's schema by following its `$ref` and applying the property's description.
 *
 * @param rootSchema - The root JSON Schema used to resolve `$ref` pointers starting with `#/`.
 * @param propSchema - The property schema which may contain a `$ref`; its `description`, if present, overrides the referenced schema's description.
 * @returns The resolved schema: the referenced schema merged with the property's description, or the original `propSchema` if no `$ref` is present or resolution fails.
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
 * Retrieve the schema fragment located at a dot-separated path, resolving any encountered `$ref` references.
 *
 * @param rootSchema - The root JSON Schema to traverse
 * @param path - Dot-separated path (e.g., "section.service") to the desired schema fragment
 * @returns The resolved `Schema` at `path`, or `undefined` if the path cannot be resolved
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
 * Convert a snake_case or camelCase key into a human-readable title.
 *
 * @param key - The key to format
 * @returns The input converted to a spaced, capitalized title (e.g., "real_debrid" -> "Real Debrid")
 */
export function formatKey(key: string): string {
    return key
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Retrieve the property keys for a service schema at the given path, excluding the "enabled" key.
 *
 * @param servicePath - Dot-separated path within the root schema to the service (e.g., "services.mailgun")
 * @returns The list of property keys for the service, excluding `"enabled"`. Returns an empty array if the service or its properties are not found.
 */
export function getServiceFields(schema: Schema, servicePath: string): string[] {
    const serviceSchema = getSchemaAtPath(schema, servicePath);
    if (!serviceSchema?.properties) return [];

    const props = serviceSchema.properties as Record<string, unknown>;
    return Object.keys(props).filter((key) => key !== "enabled");
}

/**
 * Retrieve the description string for a service at the given schema path.
 *
 * @param schema - The root JSON Schema object to search
 * @param servicePath - Dot-separated path to the service within the schema (e.g., "section.serviceName")
 * @returns The service's description string, or `undefined` if not present or the path cannot be resolved
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
 * List services defined under a schema section.
 *
 * A service is a property object that exposes an `enabled` boolean field. The returned
 * entries use the property's key and a title taken from the resolved schema's `title`
 * or a human-friendly form of the key.
 *
 * @param schema - The root JSON Schema to query.
 * @param section - Dot-separated path to the section within the schema (e.g., "services.integrations").
 * @returns An array of ServiceInfo objects for properties under the section that declare an `enabled` field; returns an empty array if the section or its properties are not found.
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