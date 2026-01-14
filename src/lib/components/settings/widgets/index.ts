import type { FieldCommonProps, SchemaValue } from "@sjsf/form";

// Module augmentation to register custom field component types.
// These replace anyOfField/objectField so they use FieldCommonProps, not WidgetCommonProps.
declare module "@sjsf/form" {
    interface ComponentProps {
        customRankWidget: FieldCommonProps<SchemaValue>;
        nullableArrayWidget: FieldCommonProps<SchemaValue>;
        nullablePrimitiveWidget: FieldCommonProps<SchemaValue>;
    }
    interface ComponentBindings {
        customRankWidget: "value";
        nullableArrayWidget: "value";
        nullablePrimitiveWidget: "value";
    }
}

export { default as CustomRankWidget } from "./custom-rank-widget.svelte";
export { default as NullableArrayWidget } from "./nullable-array-widget.svelte";
export { default as NullablePrimitiveWidget } from "./nullable-primitive-widget.svelte";
