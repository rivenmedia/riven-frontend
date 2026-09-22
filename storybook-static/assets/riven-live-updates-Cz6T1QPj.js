import{i as e}from"./preload-helper-xPQekRTU.js";import{n as t,r as n}from"./graphql-client-CUI7SPRJ.js";import{d as r,f as i,p as a,s as o,u as s}from"./riven-media-D4KKXkHW.js";function c(e,n=250){let r=!0,i;function a(){clearTimeout(i),i=setTimeout(()=>{r&&e()},n)}let o=l.map(e=>t(e,void 0,{onData:a,onError:()=>{}}));return()=>{r=!1,clearTimeout(i);for(let e of o)e()}}var l,u=e((()=>{n(),a(),l=[o,r,i,s,`subscription RivenItemScraped {
        itemScraped
    }`,`subscription RivenItemDownloaded {
        itemDownloaded
    }`,`subscription RivenItemFailed {
        itemFailed
    }`,`subscription RivenItemsDeleted {
        itemsDeleted
    }`]}));export{c as n,u as t};