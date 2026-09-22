import{i as e}from"./preload-helper-xPQekRTU.js";import{$n as t,An as n,Bn as r,Et as i,St as a,Xn as o,Zt as s,bt as c,en as l,jn as u,o as d,t as f,zn as p}from"./client-CnjRWATJ.js";import{a as m,i as h,n as g,r as _,t as v}from"./create-runtime-stories-CuDbtWJx.js";import{t as y}from"./button-BeVJhn9t.js";import{t as b}from"./button-WqyvoQZP.js";import{a as x,t as S}from"./dist-CasHptyg.js";import{n as C,t as w}from"./sonner-D83LLs_U.js";function T(e,t){u(t,!1),d(),D(e,{name:`Default`,asChild:!0,children:(e,t)=>{var n=O(),a=s(n);C(a,{});var o=l(a,2),u=s(o);y(u,{variant:`outline`,onclick:()=>x(`Event has been created`),children:(e,t)=>{p(),c(e,i(`Default`))},$$slots:{default:!0}});var d=l(u,2);y(d,{variant:`outline`,onclick:()=>x.success(`Item saved successfully`),children:(e,t)=>{p(),c(e,i(`Success`))},$$slots:{default:!0}});var f=l(d,2);y(f,{variant:`outline`,onclick:()=>x.error(`Something went wrong`),children:(e,t)=>{p(),c(e,i(`Error`))},$$slots:{default:!0}});var m=l(f,2);y(m,{variant:`outline`,onclick:()=>x.info(`A new version is available`),children:(e,t)=>{p(),c(e,i(`Info`))},$$slots:{default:!0}}),y(l(m,2),{variant:`outline`,onclick:()=>x.warning(`Your session is expiring`),children:(e,t)=>{p(),c(e,i(`Warning`))},$$slots:{default:!0}}),r(o),r(n),c(e,n)},$$slots:{default:!0},parameters:{__svelteCsf:{rawCode:`<div>
    <Toaster />
    <div class="flex flex-wrap gap-2">
        <Button variant="outline" onclick={() => toast("Event has been created")}>
            Default
        </Button>
        <Button variant="outline" onclick={() => toast.success("Item saved successfully")}>
            Success
        </Button>
        <Button variant="outline" onclick={() => toast.error("Something went wrong")}>
            Error
        </Button>
        <Button variant="outline" onclick={() => toast.info("A new version is available")}>
            Info
        </Button>
        <Button variant="outline" onclick={() => toast.warning("Your session is expiring")}>
            Warning
        </Button>
    </div>
</div>`}}}),n()}var E,D,O,k,A,j;e((()=>{t(),m(),o(),h(),w(),b(),S(),f(),g(),E={title:`ui/Sonner`,component:C,tags:[`autodocs`]},{Story:D}=_(E),O=a(`<div><!> <div class="flex flex-wrap gap-2"><!> <!> <!> <!> <!></div></div>`),T.__docgen={data:[],name:`sonner.stories.svelte`},k=v(T,E),A=[`Default`],j={...k.Default,tags:[`svelte-csf-v5`]}}))();export{j as Default,A as __namedExportsOrder,E as default};