import { describe, it, expect } from "vitest";
import {
    isNullableArraySchema,
    isNullablePrimitiveSchema,
    findNullableFields,
    buildNullableWidgetUiSchema
} from "./schema-patterns";
import type { Schema } from "@sjsf/form";

describe("isNullableArraySchema", () => {
    it("detects anyOf: [array, null]", () => {
        const schema: Schema = {
            anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }]
        };
        expect(isNullableArraySchema(schema)).toBe(true);
    });

    it("detects anyOf: [null, array] (order independent)", () => {
        const schema: Schema = {
            anyOf: [{ type: "null" }, { type: "array", items: { type: "string" } }]
        };
        expect(isNullableArraySchema(schema)).toBe(true);
    });

    it("returns false for non-nullable array", () => {
        const schema: Schema = { type: "array", items: { type: "string" } };
        expect(isNullableArraySchema(schema)).toBe(false);
    });

    it("returns false for nullable primitive", () => {
        const schema: Schema = {
            anyOf: [{ type: "integer" }, { type: "null" }]
        };
        expect(isNullableArraySchema(schema)).toBe(false);
    });

    it("returns false for anyOf with more than 2 options", () => {
        const schema: Schema = {
            anyOf: [{ type: "array" }, { type: "null" }, { type: "string" }]
        };
        expect(isNullableArraySchema(schema)).toBe(false);
    });

    it("returns false for schema without anyOf", () => {
        const schema: Schema = { type: "object" };
        expect(isNullableArraySchema(schema)).toBe(false);
    });
});

describe("isNullablePrimitiveSchema", () => {
    it("detects anyOf: [integer, null]", () => {
        const schema: Schema = {
            anyOf: [{ type: "integer" }, { type: "null" }]
        };
        expect(isNullablePrimitiveSchema(schema)).toBe(true);
    });

    it("detects anyOf: [number, null]", () => {
        const schema: Schema = {
            anyOf: [{ type: "number" }, { type: "null" }]
        };
        expect(isNullablePrimitiveSchema(schema)).toBe(true);
    });

    it("detects anyOf: [boolean, null]", () => {
        const schema: Schema = {
            anyOf: [{ type: "boolean" }, { type: "null" }]
        };
        expect(isNullablePrimitiveSchema(schema)).toBe(true);
    });

    it("returns false for nullable array", () => {
        const schema: Schema = {
            anyOf: [{ type: "array" }, { type: "null" }]
        };
        expect(isNullablePrimitiveSchema(schema)).toBe(false);
    });

    it("returns false for nullable string (not in supported types)", () => {
        const schema: Schema = {
            anyOf: [{ type: "string" }, { type: "null" }]
        };
        expect(isNullablePrimitiveSchema(schema)).toBe(false);
    });
});

describe("findNullableFields", () => {
    it("finds nullable array fields in nested structure", () => {
        const schema: Schema = {
            type: "object",
            properties: {
                filesystem: {
                    type: "object",
                    properties: {
                        library_profiles: {
                            type: "object",
                            additionalProperties: {
                                type: "object",
                                properties: {
                                    filter_rules: {
                                        type: "object",
                                        properties: {
                                            genres: {
                                                anyOf: [
                                                    { type: "array", items: { type: "string" } },
                                                    { type: "null" }
                                                ]
                                            },
                                            min_year: {
                                                anyOf: [{ type: "integer" }, { type: "null" }]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        const fields = findNullableFields(schema);

        expect(fields).toHaveLength(2);

        const genresField = fields.find((f) => f.path.includes("genres"));
        expect(genresField).toBeDefined();
        expect(genresField?.widget).toBe("nullableArrayWidget");

        const minYearField = fields.find((f) => f.path.includes("min_year"));
        expect(minYearField).toBeDefined();
        expect(minYearField?.widget).toBe("nullablePrimitiveWidget");
    });

    it("returns empty array for schema without nullable fields", () => {
        const schema: Schema = {
            type: "object",
            properties: {
                name: { type: "string" },
                count: { type: "integer" }
            }
        };

        const fields = findNullableFields(schema);
        expect(fields).toHaveLength(0);
    });

    it("handles $ref resolution", () => {
        const schema: Schema = {
            type: "object",
            properties: {
                content: {
                    $ref: "#/$defs/ContentModel"
                }
            },
            $defs: {
                ContentModel: {
                    type: "object",
                    properties: {
                        genres: {
                            anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }]
                        }
                    }
                }
            }
        };

        const fields = findNullableFields(schema);
        expect(fields).toHaveLength(1);
        expect(fields[0].path).toEqual(["content", "genres"]);
    });
});

describe("buildNullableWidgetUiSchema", () => {
    it("builds nested UI schema from field paths", () => {
        const fields = [
            { path: ["filesystem", "genres"], widget: "nullableArrayWidget" as const },
            { path: ["filesystem", "min_year"], widget: "nullablePrimitiveWidget" as const }
        ];

        const uiSchema = buildNullableWidgetUiSchema(fields);

        expect(uiSchema).toEqual({
            filesystem: {
                genres: {
                    "ui:components": { anyOfField: "nullableArrayWidget" }
                },
                min_year: {
                    "ui:components": { anyOfField: "nullablePrimitiveWidget" }
                }
            }
        });
    });

    it("handles deeply nested paths", () => {
        const fields = [
            {
                path: ["a", "b", "c", "field"],
                widget: "nullableArrayWidget" as const
            }
        ];

        const uiSchema = buildNullableWidgetUiSchema(fields);

        expect(uiSchema).toEqual({
            a: {
                b: {
                    c: {
                        field: {
                            "ui:components": { anyOfField: "nullableArrayWidget" }
                        }
                    }
                }
            }
        });
    });

    it("returns empty object for empty input", () => {
        const uiSchema = buildNullableWidgetUiSchema([]);
        expect(uiSchema).toEqual({});
    });
});
