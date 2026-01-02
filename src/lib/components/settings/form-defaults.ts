import type { FormState } from "@sjsf/form";
import type { components } from "$lib/providers/riven";

export { translation } from "@sjsf/form/translations/en";

export { resolver } from "@sjsf/form/resolvers/basic";

export { buildSettingsUiSchema, getFieldGroupsForSection } from "./ui-schema";
export type { FieldGroup } from "./ui-schema";
export type AppSettings = components["schemas"]["AppModel"];
export type SettingsFormState = FormState<AppSettings>;

import "@sjsf/form/fields/extra/enum-include";
import "@sjsf/form/fields/extra/multi-enum-include";
import "@sjsf/form/fields/extra/unknown-native-file-include";

import { theme as baseTheme } from "@sjsf/shadcn4-theme";
import { extendByRecord } from "@sjsf/form/lib/resolver";
import "@sjsf/shadcn4-theme/extra-widgets/switch-include";
import "@sjsf/shadcn4-theme/extra-widgets/textarea-include";
import "@sjsf/shadcn4-theme/extra-widgets/checkboxes-include";
import "@sjsf/shadcn4-theme/extra-widgets/radio-include";
import "@sjsf/shadcn4-theme/extra-widgets/file-include";
import "@sjsf/shadcn4-theme/extra-widgets/date-picker-include";
// import "@sjsf-lab/shadcn-extras-theme/extra-widgets/password-include";
// import "@sjsf-lab/shadcn-extras-theme/extra-widgets/tags-input-include";

import { CustomRankWidget, NullableArrayWidget, NullablePrimitiveWidget } from "./widgets";
export const theme = extendByRecord(baseTheme, {
    customRankWidget: CustomRankWidget,
    nullableArrayWidget: NullableArrayWidget,
    nullablePrimitiveWidget: NullablePrimitiveWidget
});

export { createFormIdBuilder as idBuilder } from "@sjsf/sveltekit";

export { createFormMerger as merger } from "@sjsf/form/mergers/modern";

import type { ValidatorFactoryOptions } from "@sjsf/form";
import { addFormComponents, createFormValidator } from "@sjsf/ajv8-validator";
import addFormats from "ajv-formats";

const PATH_FORMAT_REGEX = /^[/.].*/;
const MULTI_HOST_URI_REGEX = /^.+$/;

export const validator = <T>(options: ValidatorFactoryOptions) =>
    createFormValidator<T>({
        ...options,
        ajvPlugins: (ajv) => {
            addFormComponents(addFormats(ajv));

            ajv.addFormat("path", PATH_FORMAT_REGEX);
            ajv.addFormat("multi-host-uri", MULTI_HOST_URI_REGEX);

            return ajv;
        }
    });
