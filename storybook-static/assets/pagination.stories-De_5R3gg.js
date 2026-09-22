import{i as e}from"./preload-helper-xPQekRTU.js";import{$ as t,$n as n,An as r,Et as i,Nt as a,Qt as o,St as s,Wt as c,Xn as l,bt as u,en as d,it as f,jn as p,o as m,t as h,un as g,vt as _,xt as v,zn as y}from"./client-CnjRWATJ.js";import{a as b,i as x,n as S,r as C,t as w}from"./create-runtime-stories-CuDbtWJx.js";import{c as T,f as E,i as D,m as O,n as k,o as A,t as j,u as M}from"./pagination-CEqdu_wX.js";function N(e,n){p(n,!1),m(),F(e,{name:`Default`,asChild:!0,children:(e,n)=>{O(e,{count:120,perPage:10,page:4,children:(e,n)=>{let r=()=>n?.().pages,s=()=>n?.().currentPage;E(e,{children:(e,n)=>{var l=I(),p=o(l);M(p,{children:(e,t)=>{A(e,{})},$$slots:{default:!0}});var m=d(p,2);t(m,1,r,e=>e.key,(e,t)=>{var n=v(),r=o(n),l=e=>{M(e,{children:(e,t)=>{k(e,{})},$$slots:{default:!0}})},d=e=>{M(e,{children:(e,n)=>{{let n=g(()=>s()===a(t).value);T(e,{get page(){return a(t)},get isActive(){return a(n)},children:(e,n)=>{y();var r=i();c(()=>_(r,a(t).value)),u(e,r)},$$slots:{default:!0}})}},$$slots:{default:!0}})};f(r,e=>{a(t).type===`ellipsis`?e(l):e(d,-1)}),u(e,n)}),M(d(m,2),{children:(e,t)=>{D(e,{})},$$slots:{default:!0}}),u(e,l)},$$slots:{default:!0}})},$$slots:{default:!0}})},$$slots:{default:!0},parameters:{__svelteCsf:{rawCode:`<Pagination.Root count={120} perPage={10} page={4}>
    {#snippet children({ pages, currentPage })}
        <Pagination.Content>
            <Pagination.Item>
                <Pagination.PrevButton />
            </Pagination.Item>
            {#each pages as page (page.key)}
                {#if page.type === "ellipsis"}
                    <Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
                {:else}
                    <Pagination.Item>
                        <Pagination.Link {page} isActive={currentPage === page.value}>
                            {page.value}
                        </Pagination.Link>
                    </Pagination.Item>
                {/if}
            {/each}
            <Pagination.Item>
                <Pagination.NextButton />
            </Pagination.Item>
        </Pagination.Content>
    {/snippet}
</Pagination.Root>`}}}),r()}var P,F,I,L,R,z;e((()=>{n(),b(),l(),x(),j(),h(),S(),P={title:`ui/Pagination`,component:O,tags:[`autodocs`]},{Story:F}=C(P),I=s(`<!> <!> <!>`,1),N.__docgen={data:[],name:`pagination.stories.svelte`},L=w(N,P),R=[`Default`],z={...L.Default,tags:[`svelte-csf-v5`]}}))();export{z as Default,R as __namedExportsOrder,P as default};