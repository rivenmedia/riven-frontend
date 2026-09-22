import{i as e}from"./preload-helper-xPQekRTU.js";function t(e){let t=e-1;return t*t*t+1}function n(e){return e<.5?4*e*e*e:.5*(2*e-2)**3+1}function r(e){let t=typeof e==`string`&&e.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);return t?[parseFloat(t[1]),t[2]||`px`]:[e,`px`]}function i(e,{delay:t=0,duration:n=400,easing:r=c}={}){let i=+getComputedStyle(e).opacity;return{delay:t,duration:n,easing:r,css:e=>`opacity: ${e*i}`}}function a(e,{delay:n=0,duration:i=400,easing:a=t,x:o=0,y:s=0,opacity:c=0}={}){let l=getComputedStyle(e),u=+l.opacity,d=l.transform===`none`?``:l.transform,f=u*(1-c),[p,m]=r(o),[h,g]=r(s);return{delay:n,duration:i,easing:a,css:(e,t)=>`
			transform: ${d} translate(${(1-e)*p}${m}, ${(1-e)*h}${g});
			opacity: ${u-f*t}`}}function o(e,{delay:n=0,duration:r=400,easing:i=t,start:a=0,opacity:o=0}={}){let s=getComputedStyle(e),c=+s.opacity,l=s.transform===`none`?``:s.transform,u=1-a,d=c*(1-o);return{delay:n,duration:r,easing:i,css:(e,t)=>`
			transform: ${l} scale(${1-u*t});
			opacity: ${c-d*t}
		`}}function s(e,{delay:t=0,speed:r,duration:i,easing:a=n}={}){let o=e.getTotalLength(),s=getComputedStyle(e);return s.strokeLinecap!==`butt`&&(o+=parseInt(s.strokeWidth)),i===void 0?i=r===void 0?800:o/r:typeof i==`function`&&(i=i(o)),{delay:t,duration:i,easing:a,css:(e,t)=>`
			stroke-dasharray: ${o};
			stroke-dashoffset: ${t*o};
		`}}var c,l=e((()=>{c=e=>e}));export{o as a,l as i,i as n,a as r,s as t};