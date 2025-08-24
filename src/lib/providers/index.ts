import createClient from "openapi-fetch";

import type { paths as TVDBPaths } from "./tvdb";

const tvdbClient = createClient<TVDBPaths>({
    baseUrl: "https://api4.thetvdb.com/v4",
});

export default {
    tvdb: tvdbClient
};

/*
TMDB V3 OPENAPI SPEC: https://developer.themoviedb.org/openapi/64542913e1f86100738e227f
TVDB V4 OPENAPI SPEC: https://thetvdb.github.io/v4-api/swagger.yml

COMMAND TO GENERATE: pnpx openapi-typescript URL -o src/lib/providers/FILE.ts

This is different from @hey-api openapi-ts package.
*/