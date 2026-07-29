import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { gql } from "$lib/graphql-client";
import { buildBackendRoleHeaders, requireSettingsAccess } from "$lib/server/rbac";
import type {
    CustomProfile,
    InstanceStatus,
    QualityProfile,
    SettingFieldDef,
    SettingsSection,
    SetupGroup
} from "$lib/components/settings/types";

// Initial data is loaded server-side (SSR); every mutation runs client-side via
// `gqlClient` (see operations.ts), matching the rest of the app.
const RANK_PROFILES_QUERY = `query { qualityProfiles customProfiles }`;
const RANK_SETTINGS_SCHEMA_QUERY = `query { rankSettingsSchema }`;
const DEFAULT_RANK_PROFILE_QUERY = `query { defaultRankProfile }`;
const SETUP_GROUPS_QUERY = `query { setupGroups { id title description } }`;
const INSTANCE_STATUS_QUERY = `
    query {
        instanceStatus {
            setupCompleted
            readyToComplete
            enabledValidPluginCount
            enabledProfileCount
            blockers
        }
    }
`;
const SETTINGS_SECTIONS_QUERY = `
    query {
        settingsSections {
            id
            title
            kind
            schema
            values
            category
            enabled
            valid
            configured
            missingRequiredFields
            version
        }
    }
`;

export const load: PageServerLoad = async ({ fetch, locals }) => {
    requireSettingsAccess(locals.user);
    const authHeaders = buildBackendRoleHeaders(locals.user, locals.backendAuthSigningSecret);

    try {
        const [
            sectionsData,
            rankProfilesData,
            rankSchemaData,
            setupGroupsData,
            instanceStatusData,
            defaultProfileData
        ] = await Promise.all([
            gql<{ settingsSections: SettingsSection[] }>(
                locals.backendUrl,
                locals.apiKey,
                SETTINGS_SECTIONS_QUERY,
                {},
                fetch,
                authHeaders
            ).catch(() => ({ settingsSections: [] })),
            gql<{ qualityProfiles: QualityProfile[]; customProfiles: CustomProfile[] }>(
                locals.backendUrl,
                locals.apiKey,
                RANK_PROFILES_QUERY,
                {},
                fetch,
                authHeaders
            ).catch(() => ({ qualityProfiles: [], customProfiles: [] })),
            gql<{ rankSettingsSchema: SettingFieldDef[] }>(
                locals.backendUrl,
                locals.apiKey,
                RANK_SETTINGS_SCHEMA_QUERY,
                {},
                fetch,
                authHeaders
            ).catch(() => ({ rankSettingsSchema: [] })),
            gql<{ setupGroups: SetupGroup[] }>(
                locals.backendUrl,
                locals.apiKey,
                SETUP_GROUPS_QUERY,
                {},
                fetch,
                authHeaders
            ).catch(() => ({ setupGroups: [] })),
            gql<{ instanceStatus: InstanceStatus }>(
                locals.backendUrl,
                locals.apiKey,
                INSTANCE_STATUS_QUERY,
                {},
                fetch,
                authHeaders
            ).catch(() => ({
                instanceStatus: {
                    setupCompleted: false,
                    readyToComplete: false,
                    enabledValidPluginCount: 0,
                    enabledProfileCount: 0,
                    blockers: []
                }
            })),
            gql<{
                defaultRankProfile: { name: string | null; settings: Record<string, unknown> };
            }>(
                locals.backendUrl,
                locals.apiKey,
                DEFAULT_RANK_PROFILE_QUERY,
                {},
                fetch,
                authHeaders
            ).catch(() => ({ defaultRankProfile: { name: null, settings: {} } }))
        ]);

        return {
            sections: sectionsData.settingsSections,
            rankSettings: defaultProfileData.defaultRankProfile.settings,
            rankSettingsSchema: rankSchemaData.rankSettingsSchema,
            initialProfileName: defaultProfileData.defaultRankProfile.name,
            qualityProfiles: rankProfilesData.qualityProfiles ?? [],
            customProfiles: rankProfilesData.customProfiles ?? [],
            setupGroups: setupGroupsData.setupGroups,
            instanceStatus: instanceStatusData.instanceStatus
        };
    } catch {
        error(500, "Failed to load settings");
    }
};
