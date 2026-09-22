import{i as e}from"./preload-helper-xPQekRTU.js";import{$n as t,An as n,Et as r,Qt as i,St as a,Xn as o,bt as s,en as c,jn as l,o as u,t as d,zn as f}from"./client-CnjRWATJ.js";import{a as p,i as m,n as h,r as g,t as _}from"./create-runtime-stories-CuDbtWJx.js";import{c as v,i as y,n as b,o as x,t as S}from"./accordion-B5cqEGDN.js";function C(e,t){l(t,!1),u();var a=E(),o=i(a);T(o,{name:`Single`,asChild:!0,children:(e,t)=>{v(e,{type:`single`,class:`w-full max-w-md`,children:(e,t)=>{var n=D(),a=i(n);y(a,{value:`item-1`,children:(e,t)=>{var n=E(),a=i(n);b(a,{children:(e,t)=>{f(),s(e,r(`Is it accessible?`))},$$slots:{default:!0}}),x(c(a,2),{children:(e,t)=>{f(),s(e,r(`Yes. It adheres to the WAI-ARIA design pattern.`))},$$slots:{default:!0}}),s(e,n)},$$slots:{default:!0}});var o=c(a,2);y(o,{value:`item-2`,children:(e,t)=>{var n=E(),a=i(n);b(a,{children:(e,t)=>{f(),s(e,r(`Is it styled?`))},$$slots:{default:!0}}),x(c(a,2),{children:(e,t)=>{f(),s(e,r(`Yes. It comes with default styles that match the theme.`))},$$slots:{default:!0}}),s(e,n)},$$slots:{default:!0}}),y(c(o,2),{value:`item-3`,children:(e,t)=>{var n=E(),a=i(n);b(a,{children:(e,t)=>{f(),s(e,r(`Is it animated?`))},$$slots:{default:!0}}),x(c(a,2),{children:(e,t)=>{f(),s(e,r(`Yes. It's animated by default, but you can disable it if you prefer.`))},$$slots:{default:!0}}),s(e,n)},$$slots:{default:!0}}),s(e,n)},$$slots:{default:!0}})},$$slots:{default:!0},parameters:{__svelteCsf:{rawCode:`<Accordion.Root type="single" class="w-full max-w-md">
    <Accordion.Item value="item-1">
        <Accordion.Trigger>Is it accessible?</Accordion.Trigger>
        <Accordion.Content>
            Yes. It adheres to the WAI-ARIA design pattern.
        </Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="item-2">
        <Accordion.Trigger>Is it styled?</Accordion.Trigger>
        <Accordion.Content>
            Yes. It comes with default styles that match the theme.
        </Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="item-3">
        <Accordion.Trigger>Is it animated?</Accordion.Trigger>
        <Accordion.Content>
            Yes. It's animated by default, but you can disable it if you prefer.
        </Accordion.Content>
    </Accordion.Item>
</Accordion.Root>`}}}),T(c(o,2),{name:`Multiple`,asChild:!0,children:(e,t)=>{v(e,{type:`multiple`,class:`w-full max-w-md`,children:(e,t)=>{var n=E(),a=i(n);y(a,{value:`item-1`,children:(e,t)=>{var n=E(),a=i(n);b(a,{children:(e,t)=>{f(),s(e,r(`First section`))},$$slots:{default:!0}}),x(c(a,2),{children:(e,t)=>{f(),s(e,r(`Multiple items can be open at the same time.`))},$$slots:{default:!0}}),s(e,n)},$$slots:{default:!0}}),y(c(a,2),{value:`item-2`,children:(e,t)=>{var n=E(),a=i(n);b(a,{children:(e,t)=>{f(),s(e,r(`Second section`))},$$slots:{default:!0}}),x(c(a,2),{children:(e,t)=>{f(),s(e,r(`Try opening this one too.`))},$$slots:{default:!0}}),s(e,n)},$$slots:{default:!0}}),s(e,n)},$$slots:{default:!0}})},$$slots:{default:!0},parameters:{__svelteCsf:{rawCode:`<Accordion.Root type="multiple" class="w-full max-w-md">
    <Accordion.Item value="item-1">
        <Accordion.Trigger>First section</Accordion.Trigger>
        <Accordion.Content>Multiple items can be open at the same time.</Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="item-2">
        <Accordion.Trigger>Second section</Accordion.Trigger>
        <Accordion.Content>Try opening this one too.</Accordion.Content>
    </Accordion.Item>
</Accordion.Root>`}}}),s(e,a),n()}var w,T,E,D,O,k,A,j;e((()=>{t(),p(),o(),m(),S(),d(),h(),w={title:`ui/Accordion`,component:v,tags:[`autodocs`]},{Story:T}=g(w),E=a(`<!> <!>`,1),D=a(`<!> <!> <!>`,1),C.__docgen={data:[],name:`accordion.stories.svelte`},O=_(C,w),k=[`Single`,`Multiple`],A={...O.Single,tags:[`svelte-csf-v5`]},j={...O.Multiple,tags:[`svelte-csf-v5`]}}))();export{j as Multiple,A as Single,k as __namedExportsOrder,w as default};