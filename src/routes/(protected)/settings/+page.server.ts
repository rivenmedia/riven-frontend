import type { PageServerLoad } from "./$types";
import {
    SECTION_GROUPS,
    DEFAULT_SECTION_ID,
    getSectionGroupById
} from "$lib/components/settings/settings-sections";

/**
 * Settings page uses client-side data fetching for section schemas/values.
 *
 * Architecture: Section data is loaded lazily via /settings/api when each
 * section is visited, rather than loading all settings upfront during SSR.
 * This improves initial page load time since schemas can be large.
 *
 * This server load only provides the initial section ID from the URL.
 */
export const load: PageServerLoad = async ({ url }) => {
    const sectionId = url.searchParams.get("section") || DEFAULT_SECTION_ID;
    const section = getSectionGroupById(sectionId) || SECTION_GROUPS[0];

    return {
        currentSectionId: section.id
    };
};
