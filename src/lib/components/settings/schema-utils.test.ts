import { describe, it, expect } from "vitest";
import {
    getServicesFromSchema,
    getSchemaAtPath,
    formatKey,
    getServiceFields,
    getServiceDescription
} from "./schema-utils";
import type { Schema } from "@sjsf/form";

// Mock schema matching backend structure with $ref pattern
const mockSchema: Schema = {
    type: "object",
    properties: {
        scraping: {
            $ref: "#/$defs/ScrapingModel"
        },
        updaters: {
            $ref: "#/$defs/UpdatersModel"
        }
    },
    $defs: {
        ScrapingModel: {
            type: "object",
            properties: {
                torrentio: {
                    type: "object",
                    title: "Torrentio",
                    description: "Torrentio scraper service",
                    properties: {
                        enabled: { type: "boolean" },
                        url: { type: "string" },
                        timeout: { type: "integer" }
                    }
                },
                jackett: {
                    type: "object",
                    title: "Jackett",
                    properties: {
                        enabled: { type: "boolean" },
                        api_key: { type: "string" }
                    }
                },
                // Non-service field (no enabled property)
                after_2: {
                    type: "integer",
                    title: "After 2 Failures"
                }
            }
        },
        UpdatersModel: {
            type: "object",
            properties: {
                plex: {
                    type: "object",
                    title: "Plex",
                    properties: {
                        enabled: { type: "boolean" },
                        url: { type: "string" },
                        token: { type: "string" }
                    }
                }
            }
        }
    }
};

describe("getServicesFromSchema", () => {
    it("detects services with enabled property", () => {
        const services = getServicesFromSchema(mockSchema, "scraping");
        expect(services).toHaveLength(2);
        expect(services.map((s) => s.key)).toContain("torrentio");
        expect(services.map((s) => s.key)).toContain("jackett");
    });

    it("uses schema title when available", () => {
        const services = getServicesFromSchema(mockSchema, "scraping");
        const torrentio = services.find((s) => s.key === "torrentio");
        expect(torrentio?.title).toBe("Torrentio");
    });

    it("excludes non-service properties (no enabled field)", () => {
        const services = getServicesFromSchema(mockSchema, "scraping");
        expect(services.map((s) => s.key)).not.toContain("after_2");
    });

    it("handles new service added to schema", () => {
        const schemaWithNew = structuredClone(mockSchema);
        (schemaWithNew.$defs!.ScrapingModel as Schema).properties!.newScraper = {
            type: "object",
            title: "New Scraper",
            properties: { enabled: { type: "boolean" } }
        };

        const services = getServicesFromSchema(schemaWithNew, "scraping");
        expect(services.find((s) => s.key === "newScraper")).toBeDefined();
        expect(services.find((s) => s.key === "newScraper")?.title).toBe("New Scraper");
    });

    it("returns empty array for missing section", () => {
        const services = getServicesFromSchema(mockSchema, "nonexistent");
        expect(services).toEqual([]);
    });

    it("works with different sections", () => {
        const services = getServicesFromSchema(mockSchema, "updaters");
        expect(services).toHaveLength(1);
        expect(services[0].key).toBe("plex");
    });
});

describe("getSchemaAtPath", () => {
    it("resolves simple path", () => {
        const result = getSchemaAtPath(mockSchema, "scraping");
        expect(result?.type).toBe("object");
        expect(result?.properties).toHaveProperty("torrentio");
    });

    it("resolves nested path with $ref", () => {
        const result = getSchemaAtPath(mockSchema, "scraping.torrentio");
        expect(result?.title).toBe("Torrentio");
        expect(result?.properties).toHaveProperty("enabled");
    });

    it("returns undefined for non-existent path", () => {
        const result = getSchemaAtPath(mockSchema, "nonexistent.path");
        expect(result).toBeUndefined();
    });
});

describe("getServiceFields", () => {
    it("returns fields excluding enabled", () => {
        const fields = getServiceFields(mockSchema, "scraping.torrentio");
        expect(fields).toContain("url");
        expect(fields).toContain("timeout");
        expect(fields).not.toContain("enabled");
    });

    it("returns empty array for invalid path", () => {
        const fields = getServiceFields(mockSchema, "nonexistent");
        expect(fields).toEqual([]);
    });
});

describe("getServiceDescription", () => {
    it("returns description when available", () => {
        const desc = getServiceDescription(mockSchema, "scraping.torrentio");
        expect(desc).toBe("Torrentio scraper service");
    });

    it("returns undefined when no description", () => {
        const desc = getServiceDescription(mockSchema, "scraping.jackett");
        expect(desc).toBeUndefined();
    });
});

describe("formatKey", () => {
    it("converts snake_case to Title Case", () => {
        expect(formatKey("real_debrid")).toBe("Real Debrid");
        expect(formatKey("api_key")).toBe("Api Key");
    });

    it("converts camelCase to Title Case", () => {
        expect(formatKey("apiKey")).toBe("Api Key");
        expect(formatKey("maxRetries")).toBe("Max Retries");
    });

    it("handles single words", () => {
        expect(formatKey("enabled")).toBe("Enabled");
        expect(formatKey("url")).toBe("Url");
    });

    it("handles already formatted strings", () => {
        expect(formatKey("Title Case")).toBe("Title Case");
    });

    it("handles empty string", () => {
        expect(formatKey("")).toBe("");
    });

    it("handles consecutive underscores", () => {
        expect(formatKey("__foo__bar")).toBe("  Foo  Bar");
    });

    it("handles leading separator", () => {
        expect(formatKey("_leading")).toBe(" Leading");
    });

    it("handles trailing separator", () => {
        expect(formatKey("trailing_")).toBe("Trailing ");
    });

    it("handles mixed separators (hyphen and underscore)", () => {
        expect(formatKey("snake-case_mixed")).toBe("Snake-Case Mixed");
    });

    it("handles strings with numbers", () => {
        expect(formatKey("version2alpha")).toBe("Version2alpha");
    });

    it("handles multiple camel case boundaries", () => {
        expect(formatKey("XMLHttpRequest")).toBe("XMLHttp Request");
    });
});
