import{i as e}from"./preload-helper-xPQekRTU.js";function t(e){return{id:e.id,title:e.title,poster_path:e.posterPath,media_type:e.mediaType,year:e.year,vote_average:e.voteAverage,vote_count:e.voteCount,popularity:e.popularity??void 0,overview:e.overview??void 0,backdrop_path:e.backdropPath??void 0,genre_ids:e.genreIds??void 0,release_date:e.releaseDate??void 0,first_air_date:e.firstAirDate??void 0,original_title:e.originalTitle??void 0,original_language:e.originalLanguage??void 0,indexer:e.indexer}}function n(e){return e.map(t)}var r,i,a=e((()=>{r=`
    id
    title
    posterPath
    mediaType
    year
    voteAverage
    voteCount
    popularity
    overview
    backdropPath
    genreIds
    releaseDate
    firstAirDate
    originalTitle
    originalLanguage
    indexer
`,`${r}`,`${r}`,`${r}`,i=`query SearchTmdb($type: String!, $params: JSON, $searchMode: String) {
    searchTmdb(type: $type, params: $params, searchMode: $searchMode) {
        results { ${r} }
        page totalPages totalResults
    }
}`}));export{a as n,n as r,i as t};