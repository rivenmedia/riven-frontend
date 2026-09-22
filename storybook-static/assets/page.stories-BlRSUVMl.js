import{i as e}from"./preload-helper-xPQekRTU.js";import{$ as t,$n as n,An as r,Bn as i,Gt as a,Nt as o,Qt as s,St as c,Xn as l,Xt as u,a as d,bt as f,cn as p,dt as m,en as h,fn as g,it as _,jn as v,nn as y,o as b,on as x,pt as S,t as C,un as w,z as T,zt as E}from"./client-CnjRWATJ.js";import{I as D,N as O,Y as k}from"./iframe-DQKhfIee.js";import{a as A,i as j,n as M,r as N,t as P}from"./create-runtime-stories-CuDbtWJx.js";import{n as ee,t as te}from"./permissions-BVLupCNF.js";import{n as ne,t as re}from"./activity-card-DOfHH6Od.js";import{n as ie,t as ae}from"./downloader-services-grid-Dy9eEnY0.js";import{n as oe,t as se}from"./kpi-stat-tile-B-_uWePx.js";import{n as ce,t as le}from"./library-charts-card-Czyquvua.js";import{n as F,t as I}from"./release-year-card-BNk3mm7E.js";import{n as L,t as R}from"./service-status-card-Brs4oEBm.js";import{n as z,t as B}from"./usenet-activity-card-C-FVZfSA.js";import{r as V,t as H}from"./graphql-client-CUI7SPRJ.js";import{n as U,t as ue}from"./usenet-health-card-BSuuQhss.js";import{n as de,t as fe}from"./usenet-providers-card-Ee35X0f7.js";import{n as pe,t as me}from"./watching-now-card-O_fco8Ic.js";import{n as he,t as ge}from"./page-shell-BTj_hjs4.js";import{n as _e,t as ve}from"./riven-live-updates-Cz6T1QPj.js";function W(e,n){v(n,!0);let c=p(y([])),l=p(y([])),m=p(void 0),b=p(y([])),C=p(null),w=p(y([])),D={healthy:0,unhealthy:0,notIngested:0,unknown:0,total:0},O=p(y(D)),k=p(null),A=g(()=>n.data.services??null),j=g(()=>o(m)?`${o(m).completion_rate.toFixed(2)}%`:`0%`),M=g(()=>[{title:`Total Items`,value:o(m)?.total_items.toLocaleString()},{title:`Completed`,value:o(m)?.states.Completed?.toLocaleString()},{title:`Incomplete`,value:o(m)?.incomplete_items.toLocaleString(),tone:`warning`},{title:`Completion Rate`,value:o(j)}]);function N(e){let t=e.stats;return{total_movies:t.totalMovies,total_shows:t.totalShows,total_seasons:t.totalSeasons,total_episodes:t.totalEpisodes,total_items:t.totalItems,incomplete_items:t.incompleteItems,completion_rate:t.completionRate,states:{Completed:t.completed,Scraped:t.scraped,Indexed:t.indexed,Failed:t.failed,Paused:t.paused,Ongoing:t.ongoing,PartiallyCompleted:t.partiallyCompleted,Unreleased:t.unreleased},activity:e.activity??{},media_year_releases:e.yearReleases??[]}}async function P(){x(m,N(await H(`
        query DashboardStats {
            stats {
                totalMovies
                totalShows
                totalSeasons
                totalEpisodes
                totalItems
                incompleteItems
                completionRate
                completed
                scraped
                indexed
                failed
                paused
                ongoing
                partiallyCompleted
                unreleased
            }
            activity
            yearReleases {
                year
                count
            }
        }
    `)),!0)}a(()=>{let e=!1;return Promise.resolve(n.data.statistics).then(t=>{!e&&t!=null&&x(m,t,!0)}),Promise.resolve(n.data.activePlaybackSessions).then(t=>{e||x(c,t??[],!0)}),Promise.resolve(n.data.downloaderServices).then(t=>{e||x(l,t??[],!0)}),Promise.resolve(n.data.usenetHealth).then(t=>{!e&&t&&(x(b,t.providers??[],!0),x(C,t.streaming??null,!0),x(w,t.titles??[],!0),x(O,t.titleSummary??D,!0),x(k,t.traffic??null,!0))}),()=>{e=!0}}),a(()=>_e(P)),S(()=>{let e=!1,t=window.setInterval(async()=>{try{let t=await H(`
        query {
            activePlaybackSessions {
                server
                userName
                parentTitle
                itemTitle
                itemType
                seasonNumber
                episodeNumber
                playbackState
                playbackMethod
                positionSeconds
                durationSeconds
                deviceName
                clientName
                imageUrl
            }
        }
    `);e||x(c,t.activePlaybackSessions??[],!0)}catch{}try{let t=await H(`
        query {
            nntpProviders {
                host
                port
                priority
                isBackup
                maxConnections
                openConnections
                idleConnections
                activeConnections
                demoted
                consecutiveNotFound
            }
            usenetStreamingHealth {
                caches {
                    name
                    bytesUsed
                    bytesMax
                    entries
                    hits
                    misses
                    hitRate
                }
                cacheHitRate
                fetchesOk
                fetchesFailed
                fetchSuccessRate
                bytesDecoded
                inFlight
                deadSegments
                activeStreams
            }
            usenetTitleHealth {
                infoHash
                fileIndex
                mediaItemId
                status
                totalSegments
                sampledSegments
                missingSegments
                errorSegments
                missingPct
                checkedAt
                repairAttempts
                nextRepairAt
                title
                subtitle
                posterPath
                mediaType
            }
            usenetTitleHealthSummary {
                healthy
                unhealthy
                notIngested
                unknown
                total
            }
            usenetTraffic {
                totalBytesDownloaded
                totalArticlesDownloaded
                providers {
                    host
                    bytesDownloaded
                    articlesDownloaded
                }
                daily {
                    day
                    host
                    bytesDownloaded
                    articlesDownloaded
                }
            }
        }
    `);e||(x(b,t.nntpProviders??[],!0),x(C,t.usenetStreamingHealth??null,!0),x(w,t.usenetTitleHealth??[],!0),x(O,t.usenetTitleHealthSummary??D,!0),x(k,t.usenetTraffic??null,!0))}catch{}},15e3);return()=>{e=!0,window.clearInterval(t)}}),T(`c1luzl`,e=>{E(()=>{u.title=`Dashboard - Riven`})}),ge(e,{class:`mx-auto w-full max-w-7xl`,children:(e,n)=>{var r=K(),a=h(s(r),2);t(a,21,()=>o(M),e=>e.title,(e,t)=>{se(e,d(()=>o(t)))}),i(a);var u=h(a,2);{let e=g(()=>o(m)?.activity??{});re(u,{get activity(){return o(e)}})}var p=h(u,2);le(p,{get statistics(){return o(m)}});var v=h(p,2);{let e=g(()=>o(m)?.media_year_releases??[]);I(v,{get data(){return o(e)}})}var y=h(v,2);R(y,{get statuses(){return o(A)}});var x=h(y,2);ae(x,{get services(){return o(l)}});var S=h(x,2);me(S,{get sessions(){return o(c)}});var T=h(S,2),E=e=>{var t=G(),n=s(t);fe(n,{get providers(){return o(b)}});var r=h(n,2);B(r,{get health(){return o(C)},get traffic(){return o(k)}}),ue(h(r,2),{get titles(){return o(w)},get summary(){return o(O)}}),f(e,t)};_(T,e=>{o(b).length>0&&e(E)}),f(e,r)},$$slots:{default:!0}}),r()}var G,K,ye=e((()=>{n(),l(),C(),he(),V(),ne(),ce(),F(),L(),ie(),pe(),de(),z(),U(),oe(),m(),ve(),G=c(`<!> <!> <!>`,1),K=c(`<header class="border-border/60 border-b pb-6"><h1 class="text-3xl font-bold tracking-tight">Media Library Statistics</h1></header> <section class="grid grid-cols-1 gap-x-10 gap-y-4 py-2 md:grid-cols-2 lg:grid-cols-4"></section> <!> <!> <!> <!> <!> <!> <!>`,1),W.__docgen={data:[{name:`data`,visibility:`public`,keywords:[{name:`required`,description:``}],kind:`let`,type:{kind:`type`,type:`any`,text:`any`},static:!1,readonly:!1}],name:`+page.svelte`}}));function q(e,t){v(t,!1);let n={total_movies:842,total_shows:156,total_seasons:612,total_episodes:11029,total_items:998,incomplete_items:47,completion_rate:95.29,states:{Completed:951,Scraped:8,Indexed:0,Failed:15,Paused:0,Ongoing:12,PartiallyCompleted:0,Unreleased:0},activity:{},media_year_releases:[{year:2022,count:121},{year:2023,count:154},{year:2024,count:178}]},i={user:{id:`1`,name:`Alice`,email:`alice@example.com`},permissions:te(`user`),statistics:Promise.resolve(n),activePlaybackSessions:Promise.resolve([{server:`Plex`,userName:`alice`,parentTitle:`Arcane`,itemTitle:`The Base Violence Necessary for Change`,itemType:`episode`,seasonNumber:2,episodeNumber:5,playbackState:`playing`,playbackMethod:`Direct Play`,positionSeconds:842,durationSeconds:1620,deviceName:`Living Room TV`,clientName:`Plex for Android TV`,imageUrl:null}]),downloaderServices:Promise.resolve([{service:`Real-Debrid`,email:`user@example.com`,username:`rdUser`,premium_status:`premium`,premium_expires_at:`2025-12-31T00:00:00Z`,premium_days_left:120,points:4500,total_downloaded_bytes:0xfa00000000,cooldown_until:null}]),usenetHealth:Promise.resolve({providers:[{host:`news.provider-a.com`,port:563,priority:0,isBackup:!1,maxConnections:50,openConnections:32,idleConnections:8,activeConnections:24,demoted:!1,consecutiveNotFound:0}],streaming:{caches:[{name:`segment-cache`,bytesUsed:4294967296,bytesMax:8589934592,entries:18234,hits:92381,misses:4021,hitRate:.958}],cacheHitRate:.958,fetchesOk:128492,fetchesFailed:342,fetchSuccessRate:.9973,bytesDecoded:549755813888,inFlight:12,deadSegments:8,activeStreams:4},titles:[{infoHash:`abc123`,fileIndex:0,mediaItemId:42,status:`healthy`,totalSegments:500,sampledSegments:50,missingSegments:0,errorSegments:0,missingPct:0,checkedAt:1718e6,repairAttempts:0,nextRepairAt:null,title:`John Wick: Chapter 4`,subtitle:null,posterPath:null,mediaType:`movie`}],titleSummary:{healthy:340,unhealthy:12,notIngested:3,unknown:1,total:356},traffic:{providers:[{host:`news.provider-a.com`,bytesDownloaded:274877906944,articlesDownloaded:89234}],daily:[{day:`2024-06-08`,host:`news.provider-a.com`,bytesDownloaded:42949672960,articlesDownloaded:12043}],totalBytesDownloaded:412316860416,totalArticlesDownloaded:130437}})};b();{let t=w(()=>({data:i}));X(e,{name:`Default`,beforeEach:({msw:e})=>{e.use(J.query(`DashboardStats`,()=>k.json({data:{stats:{totalMovies:n.total_movies,totalShows:n.total_shows,totalSeasons:n.total_seasons,totalEpisodes:n.total_episodes,totalItems:n.total_items,incompleteItems:n.incomplete_items,completionRate:n.completion_rate,completed:951,scraped:8,indexed:0,failed:15,paused:0,ongoing:0,partiallyCompleted:0,unreleased:0},activity:{},yearReleases:n.media_year_releases}})))},get args(){return o(t)},parameters:{__svelteCsf:{rawCode:`<DashboardPage {...args} />`}}})}r()}var J,Y,X,Z,Q,$;e((()=>{n(),A(),l(),j(),ye(),O(),C(),ee(),M(),J=D.link(`/graphql`),Y={title:`pages/Dashboard`,component:W,tags:[`autodocs`],parameters:{layout:`fullscreen`,docs:{description:{component:"A static snapshot only: the page polls `ActivePlaybackSessions`/usenet health every 15s and refreshes on a live-update subscription — none of that polling is exercised, just one fixed render seeded from `data` plus a mocked `DashboardStats` query."}}}},{Story:X}=N(Y),q.__docgen={data:[],name:`page.stories.svelte`},Z=P(q,Y),Q=[`Default`],$={...Z.Default,tags:[`svelte-csf-v5`]}}))();export{$ as Default,Q as __namedExportsOrder,Y as default};