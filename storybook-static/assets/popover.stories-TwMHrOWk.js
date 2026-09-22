import{i as e}from"./preload-helper-xPQekRTU.js";import{$n as t,An as n,Bn as r,Et as i,Qt as a,St as o,Xn as s,Zt as c,a as l,bt as u,en as d,jn as f,o as p,t as m,zn as h}from"./client-CnjRWATJ.js";import{a as g,i as _,n as v,r as y,t as b}from"./create-runtime-stories-CuDbtWJx.js";import{t as x}from"./button-BeVJhn9t.js";import{t as S}from"./button-WqyvoQZP.js";import{c as C,i as w,n as T,o as E,t as D,u as O}from"./popover-BLngC8ua.js";function k(e,t){f(t,!1),p(),j(e,{name:`Default`,asChild:!0,children:(e,t)=>{O(e,{children:(e,t)=>{var n=N(),o=a(n);T(o,{child:(e,t)=>{x(e,l(()=>t?.().props,{variant:`outline`,children:(e,t)=>{h(),u(e,i(`Open Popover`))},$$slots:{default:!0}}))},$$slots:{child:!0}}),C(d(o,2),{class:`w-72`,children:(e,t)=>{var n=M(),a=c(n);w(a,{class:`font-medium`,children:(e,t)=>{h(),u(e,i(`Dimensions`))},$$slots:{default:!0}}),E(d(a,2),{class:`text-muted-foreground text-sm`,children:(e,t)=>{h(),u(e,i(`Set the dimensions for the layer.`))},$$slots:{default:!0}}),r(n),u(e,n)},$$slots:{default:!0}}),u(e,n)},$$slots:{default:!0}})},$$slots:{default:!0},parameters:{__svelteCsf:{rawCode:`<Popover.Root>
    <Popover.Trigger>
        {#snippet child({ props })}
            <Button {...props} variant="outline">Open Popover</Button>
        {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-72">
        <div class="grid gap-2">
            <Popover.Title class="font-medium">Dimensions</Popover.Title>
            <Popover.Description class="text-muted-foreground text-sm">
                Set the dimensions for the layer.
            </Popover.Description>
        </div>
    </Popover.Content>
</Popover.Root>`}}}),n()}var A,j,M,N,P,F,I;e((()=>{t(),g(),s(),_(),D(),S(),m(),v(),A={title:`ui/Popover`,component:O,tags:[`autodocs`],parameters:{layout:`centered`}},{Story:j}=y(A),M=o(`<div class="grid gap-2"><!> <!></div>`),N=o(`<!> <!>`,1),k.__docgen={data:[],name:`popover.stories.svelte`},P=b(k,A),F=[`Default`],I={...P.Default,tags:[`svelte-csf-v5`]}}))();export{I as Default,F as __namedExportsOrder,A as default};