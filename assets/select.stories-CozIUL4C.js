import{i as e}from"./preload-helper-xPQekRTU.js";import{$ as t,$n as n,An as r,Et as i,Nt as a,Qt as o,St as s,Wt as c,Xn as l,bt as u,en as d,jn as f,o as p,t as m,vt as h,xt as g,zn as _}from"./client-CnjRWATJ.js";import{a as v,i as y,n as b,r as x,t as S}from"./create-runtime-stories-CuDbtWJx.js";import{c as C,f as w,i as T,n as E,o as D,t as O,u as k}from"./select-C9gkOJUf.js";function A(e,n){f(n,!1),p();var s=F(),l=o(s);M(l,{name:`Default`,asChild:!0,children:(e,n)=>{w(e,{type:`single`,value:`apple`,children:(e,n)=>{var r=F(),s=o(r);T(s,{class:`w-[180px]`,children:(e,t)=>{u(e,P())},$$slots:{default:!0}}),D(d(s,2),{children:(e,n)=>{var r=g();t(o(r),1,()=>N,e=>e.value,(e,t)=>{C(e,{get value(){return a(t).value},get label(){return a(t).label},children:(e,n)=>{_();var r=i();c(()=>h(r,a(t).label)),u(e,r)},$$slots:{default:!0}})}),u(e,r)},$$slots:{default:!0}}),u(e,r)},$$slots:{default:!0}})},$$slots:{default:!0},parameters:{__svelteCsf:{rawCode:`<Select.Root type="single" value="apple">
    <Select.Trigger class="w-[180px]">
        <span class="truncate">Apple</span>
    </Select.Trigger>
    <Select.Content>
        {#each fruits as fruit (fruit.value)}
            <Select.Item value={fruit.value} label={fruit.label}>
                {fruit.label}
            </Select.Item>
        {/each}
    </Select.Content>
</Select.Root>`}}}),M(d(l,2),{name:`WithGroupLabel`,asChild:!0,children:(e,n)=>{w(e,{type:`single`,children:(e,n)=>{var r=F(),s=o(r);T(s,{class:`w-[180px]`,children:(e,t)=>{u(e,I())},$$slots:{default:!0}}),D(d(s,2),{children:(e,n)=>{k(e,{children:(e,n)=>{var r=F(),s=o(r);E(s,{children:(e,t)=>{_(),u(e,i(`Fruits`))},$$slots:{default:!0}}),t(d(s,2),1,()=>N,e=>e.value,(e,t)=>{C(e,{get value(){return a(t).value},get label(){return a(t).label},children:(e,n)=>{_();var r=i();c(()=>h(r,a(t).label)),u(e,r)},$$slots:{default:!0}})}),u(e,r)},$$slots:{default:!0}})},$$slots:{default:!0}}),u(e,r)},$$slots:{default:!0}})},$$slots:{default:!0},parameters:{__svelteCsf:{rawCode:`<Select.Root type="single">
    <Select.Trigger class="w-[180px]">
        <span class="truncate">Select a fruit</span>
    </Select.Trigger>
    <Select.Content>
        <Select.Group>
            <Select.GroupHeading>Fruits</Select.GroupHeading>
            {#each fruits as fruit (fruit.value)}
                <Select.Item value={fruit.value} label={fruit.label}>
                    {fruit.label}
                </Select.Item>
            {/each}
        </Select.Group>
    </Select.Content>
</Select.Root>`}}}),u(e,s),r()}var j,M,N,P,F,I,L,R,z,B;e((()=>{n(),v(),l(),y(),O(),m(),b(),j={title:`ui/Select`,component:w,tags:[`autodocs`]},{Story:M}=x(j),N=[{value:`apple`,label:`Apple`},{value:`banana`,label:`Banana`},{value:`blueberry`,label:`Blueberry`},{value:`grapes`,label:`Grapes`},{value:`pineapple`,label:`Pineapple`}],P=s(`<span class="truncate">Apple</span>`),F=s(`<!> <!>`,1),I=s(`<span class="truncate">Select a fruit</span>`),A.__docgen={data:[],name:`select.stories.svelte`},L=S(A,j),R=[`Default`,`WithGroupLabel`],z={...L.Default,tags:[`svelte-csf-v5`]},B={...L.WithGroupLabel,tags:[`svelte-csf-v5`]}}))();export{z as Default,B as WithGroupLabel,R as __namedExportsOrder,j as default};