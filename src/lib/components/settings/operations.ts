// Shared GraphQL operation strings for the settings + setup surfaces.
// All settings mutations run client-side via `gqlClient` (the app-wide pattern);
// the `/graphql` proxy injects the API key + signed RBAC headers server-side.

const SECTION_FIELDS = `
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
`;

export const UPDATE_SETTINGS = `
    mutation UpdateSettings($section: String!, $values: JSON!) {
        updateSettings(section: $section, values: $values) { ${SECTION_FIELDS} }
    }
`;

export const INSTANCE_STATUS = `
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

export const COMPLETE_INITIAL_SETUP = `mutation { completeInitialSetup }`;

export const SAVE_CUSTOM_PROFILE = `mutation SaveCustomProfile($id: Int, $name: String!, $settings: JSON!, $enabled: Boolean) { saveCustomProfile(id: $id, name: $name, settings: $settings, enabled: $enabled) }`;
export const DELETE_CUSTOM_PROFILE = `mutation DeleteCustomProfile($id: Int!) { deleteCustomProfile(id: $id) }`;
export const SET_PROFILE_ENABLED = `mutation SetProfileEnabled($name: String!, $enabled: Boolean!) { setProfileEnabled(name: $name, enabled: $enabled) }`;
export const UPDATE_PROFILE_SETTINGS = `mutation UpdateProfileSettings($name: String!, $settings: JSON!) { updateProfileSettings(name: $name, settings: $settings) }`;
export const CUSTOM_PROFILES = `query { customProfiles }`;
