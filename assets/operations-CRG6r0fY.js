import{i as e}from"./preload-helper-xPQekRTU.js";var t,n,r,i,a,o,s,c,l,u=e((()=>{t=`
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
`,n=`
    mutation UpdateSettings($section: String!, $values: JSON!) {
        updateSettings(section: $section, values: $values) { ${t} }
    }
`,r=`
    query {
        instanceStatus {
            setupCompleted
            readyToComplete
            enabledValidPluginCount
            enabledProfileCount
            blockers
        }
    }
`,i=`mutation { completeInitialSetup }`,a=`mutation SaveCustomProfile($id: Int, $name: String!, $settings: JSON!, $enabled: Boolean) { saveCustomProfile(id: $id, name: $name, settings: $settings, enabled: $enabled) }`,o=`mutation DeleteCustomProfile($id: Int!) { deleteCustomProfile(id: $id) }`,s=`mutation SetProfileEnabled($name: String!, $enabled: Boolean!) { setProfileEnabled(name: $name, enabled: $enabled) }`,c=`mutation UpdateProfileSettings($name: String!, $settings: JSON!) { updateProfileSettings(name: $name, settings: $settings) }`,l=`query { customProfiles }`}));export{a,n as c,r as i,u as l,l as n,s as o,o as r,c as s,i as t};