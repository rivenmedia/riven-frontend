import{i as e}from"./preload-helper-xPQekRTU.js";function t(e){return{id:e.id??void 0,file_size:e.fileSize??void 0,original_filename:e.originalFilename??void 0,download_url:e.downloadUrl??void 0,provider:e.provider??void 0,provider_download_id:e.providerDownloadId??void 0,path:e.path??void 0,plugin:e.plugin??void 0,ranking_profile_name:e.rankingProfileName??void 0,media_metadata:e.mediaMetadata}}function n(e){return e?{id:e.id,state:e.state,imdb_id:e.imdbId??void 0,tmdb_id:e.tmdbId??void 0,tvdb_id:e.tvdbId??void 0,media_metadata:e.filesystemEntry?.mediaMetadata,filesystem_entry:e.filesystemEntry?t(e.filesystemEntry):void 0,filesystem_entries:e.filesystemEntries?.map(t)??[],seasons:e.seasons?.map(e=>({season_number:e.seasonNumber,state:e.state,is_requested:e.isRequested,episodes:e.episodes?.map(e=>({episode_number:e.episodeNumber,state:e.state,media_metadata:e.filesystemEntry?.mediaMetadata,filesystem_entry:e.filesystemEntry?t(e.filesystemEntry):void 0,filesystem_entries:e.filesystemEntries?.map(t)??[]}))}))}:null}function r(e){return e?{id:e.id,state:e.state,imdb_id:e.imdbId??void 0,tmdb_id:e.tmdbId??void 0,tvdb_id:e.tvdbId??void 0,seasons:e.seasons?.map(e=>({season_number:e.seasonNumber??0,state:e.state,is_requested:e.isRequested,episodes:e.episodes?.map(e=>({episode_number:e.episodeNumber??0,state:e.state}))}))}:null}var i,a,o,s,c,l,u,d,f,p,m,h,g,_,v,y,b=e((()=>{i=`
    id state imdbId tmdbId tvdbId
    filesystemEntry {
        id fileSize originalFilename downloadUrl
        provider providerDownloadId path plugin rankingProfileName mediaMetadata
    }
    filesystemEntries {
        id fileSize originalFilename downloadUrl
        provider providerDownloadId path plugin rankingProfileName mediaMetadata
    }
    seasons {
        seasonNumber state isRequested
        episodes {
            episodeNumber state
            filesystemEntry {
                id fileSize originalFilename downloadUrl
                provider providerDownloadId path plugin rankingProfileName mediaMetadata
            }
            filesystemEntries {
                id fileSize originalFilename downloadUrl
                provider providerDownloadId path plugin rankingProfileName mediaMetadata
            }
        }
    }
`,a=`
    id fileSize createdAt updatedAt mediaItemId entryType path
    originalFilename downloadUrl plugin provider providerDownloadId
    libraryProfiles mediaMetadata language parentOriginalFilename subtitleContent
    fileHash videoFileSize opensubtitlesId streamId resolution rankingProfileName
`,o=`
    id title fullTitle state imdbId tmdbId tvdbId posterPath
    createdAt updatedAt indexedAt scrapedAt scrapedTimes
    aliases network country language isAnime airedAt year genres rating contentRating
    failedAttempts itemType isRequested showStatus seasonNumber isSpecial parentId
    episodeNumber absoluteNumber runtime itemRequestId activeStreamId
    filesystemEntry {
        ${a}
    }
    filesystemEntries {
        ${a}
    }
    seasons {
        id title seasonNumber isSpecial parentId createdAt updatedAt indexedAt scrapedAt
        scrapedTimes failedAttempts itemType state isRequested
        episodes {
            id title episodeNumber absoluteNumber runtime airedAt parentId createdAt updatedAt
            indexedAt scrapedAt scrapedTimes failedAttempts itemType state isRequested
            filesystemEntry {
                ${a}
            }
            filesystemEntries {
                ${a}
            }
        }
    }
`,s=`
    id state imdbId tmdbId tvdbId
    seasons {
        id seasonNumber state isRequested
        episodes {
            id episodeNumber state
        }
    }
`,c=`query($tmdbId: String!) {
    mediaItemFullByTmdb(tmdbId: $tmdbId) {
        ${i}
    }
}`,l=`query($tvdbId: String!) {
    mediaItemFullByTvdb(tvdbId: $tvdbId) {
        ${i}
    }
}`,u=`query($tmdbId: String!) {
    mediaItemFullByTmdb(tmdbId: $tmdbId) {
        ${o}
    }
}`,d=`query($tvdbId: String!) {
    mediaItemFullByTvdb(tvdbId: $tvdbId) {
        ${o}
    }
}`,f=`subscription($tmdbId: String!) {
    mediaItemStateUpdatesByTmdb(tmdbId: $tmdbId) {
        ${s}
    }
}`,p=`subscription($tvdbId: String!) {
    mediaItemStateUpdatesByTvdb(tvdbId: $tvdbId) {
        ${s}
    }
}`,m=`subscription {
    movieRequested {
        id tmdbId imdbId requestType state
    }
}`,h=`subscription {
    showRequested {
        id tvdbId imdbId requestType state
    }
}`,g=`subscription {
    showRequestUpdated {
        id tvdbId imdbId requestType state
    }
}`,_=`subscription {
    showIndexed {
        id tvdbId tmdbId imdbId state
    }
}`,v=`query($tmdbId: String!) {
    mediaItemStateByTmdb(tmdbId: $tmdbId) {
        ${s}
    }
}`,y=`query($tvdbId: String!) {
    mediaItemStateByTvdb(tvdbId: $tvdbId) {
        ${s}
    }
}`}));export{f as a,u as c,h as d,g as f,r as h,y as i,d as l,n as m,l as n,p as o,b as p,v as r,m as s,c as t,_ as u};