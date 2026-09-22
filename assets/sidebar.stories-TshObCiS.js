import{i as e}from"./preload-helper-xPQekRTU.js";import{$n as t,An as n,Bn as r,Qt as i,St as a,Xn as o,Zt as s,bt as c,en as l,jn as u,o as d,t as f}from"./client-CnjRWATJ.js";import{a as p,i as m,n as h,r as g,t as _}from"./create-runtime-stories-CuDbtWJx.js";import{n as v,t as y}from"./AppStoreContextDecorator-w8D_MJoE.js";import{n as b,t as x}from"./sidebar-BQ-olaDf.js";function S(e,t){u(t,!1),d();var a=E(),o=i(a);w(o,{name:`AdminUser`,asChild:!0,children:(e,t)=>{var n=T();x(s(n),{user:{name:`Alice Admin`,username:`alice`,role:`admin`,image:null}}),r(n),c(e,n)},$$slots:{default:!0},parameters:{__svelteCsf:{rawCode:`<div class="h-screen bg-zinc-950">
    <Sidebar
        user={{
            name: "Alice Admin",
            username: "alice",
            role: "admin",
            image: null
        }} />
</div>`}}});var f=l(o,2);w(f,{name:`RegularUser`,asChild:!0,children:(e,t)=>{var n=T();x(s(n),{user:{name:`Bob Viewer`,username:`bob`,role:`user`,image:null}}),r(n),c(e,n)},$$slots:{default:!0},parameters:{__svelteCsf:{rawCode:`<div class="h-screen bg-zinc-950">
    <Sidebar
        user={{
            name: "Bob Viewer",
            username: "bob",
            role: "user",
            image: null
        }} />
</div>`}}}),w(l(f,2),{name:`Guest`,asChild:!0,children:(e,t)=>{var n=T();x(s(n),{user:void 0}),r(n),c(e,n)},$$slots:{default:!0},parameters:{__svelteCsf:{rawCode:`<div class="h-screen bg-zinc-950">
    <Sidebar user={undefined} />
</div>`}}}),c(e,a),n()}var C,w,T,E,D,O,k,A,j;e((()=>{t(),p(),o(),m(),b(),v(),f(),h(),C={title:`components/Sidebar`,component:x,tags:[`autodocs`],decorators:[()=>({Component:y})],parameters:{layout:`fullscreen`}},{Story:w}=g(C),T=a(`<div class="h-screen bg-zinc-950"><!></div>`),E=a(`<!> <!> <!>`,1),S.__docgen={data:[],name:`sidebar.stories.svelte`},D=_(S,C),O=[`AdminUser`,`RegularUser`,`Guest`],k={...D.AdminUser,tags:[`svelte-csf-v5`]},A={...D.RegularUser,tags:[`svelte-csf-v5`]},j={...D.Guest,tags:[`svelte-csf-v5`]}}))();export{k as AdminUser,j as Guest,A as RegularUser,O as __namedExportsOrder,C as default};