import{i as e}from"./preload-helper-xPQekRTU.js";import{r as t,t as n}from"./graphql-client-CUI7SPRJ.js";async function r(e,t,r){return(await n(`query Ratings($id: String!, $mediaType: String!) {
            ratings(indexer: "tmdb", id: $id, mediaType: $mediaType) {
                scores { name image score url }
            }
        }`,{id:String(e),mediaType:t},r)).ratings}function i(){if(o.size>=s){let e=o.keys().next().value;e&&o.delete(e)}}function a(e,t,n){let a=`${t}-${e}`;if(o.has(a)){let e=o.get(a);return o.delete(a),o.set(a,e),e}i();let s=r(e,t,n).catch(e=>{throw o.get(a)===s&&o.delete(a),e});return o.set(a,s),s}var o,s,c=e((()=>{t(),o=new Map,s=100}));export{c as n,a as t};