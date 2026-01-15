import { json } from "@sveltejs/kit";
import providers from "$lib/providers";
import { TMDB_IMAGE_BASE_URL } from "$lib/providers";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, fetch }) => {
    const { type, id } = params;

    if (!type || !id || (type !== "movie" && type !== "tv")) {
        return json({ error: "Invalid type or id" }, { status: 400 });
    }

    try {
        let endpoint = "";
        let pathParams = {};
        let appendToResponse = "images";

        if (type === "movie") {
            endpoint = "/3/movie/{movie_id}";
            pathParams = { movie_id: Number(id) };
            appendToResponse = "images,release_dates";
        } else {
            endpoint = "/3/tv/{series_id}";
            pathParams = { series_id: Number(id) };
            appendToResponse = "images,content_ratings";
        }

        const { data, error } = await providers.tmdb.GET(endpoint as any, {
            fetch,
            params: {
                path: pathParams,
                query: {
                    append_to_response: appendToResponse
                }
            }
        });

        if (error || !data) {
            return json({ logo: null, certification: null });
        }

        // --- Logo Logic ---
        // @ts-ignore
        const logos = data.images?.logos || [];
        // @ts-ignore
        const englishLogo = logos.find((logo) => logo.iso_639_1 === "en");
        // @ts-ignore
        const chosenLogo = englishLogo || logos[0];
        const logoUrl = chosenLogo ? `${TMDB_IMAGE_BASE_URL}/w500${chosenLogo.file_path}` : null;

        // --- Certification Logic ---
        let certification = null;

        if (type === "movie") {
            // @ts-ignore
            const releaseDates = data.release_dates?.results || [];
            // @ts-ignore
            const usRelease = releaseDates.find((r) => r.iso_3166_1 === "US");
            if (usRelease) {
                // @ts-ignore
                const cert = usRelease.release_dates.find((d) => d.certification);
                certification = cert ? cert.certification : null;
            }
        } else {
            // @ts-ignore
            const contentRatings = data.content_ratings?.results || [];
            // @ts-ignore
            const usRating = contentRatings.find((r) => r.iso_3166_1 === "US");
            certification = usRating ? usRating.rating : null;
        }

        return json({ logo: logoUrl, certification });
    } catch (e) {
        console.error("Error fetching logo:", e);
        return json({ logo: null }, { status: 500 });
    }
};
