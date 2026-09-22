import{i as e}from"./preload-helper-xPQekRTU.js";import{$n as t,An as n,Bn as r,Et as i,Qt as a,St as o,Xn as s,Zt as c,a as l,bt as u,en as d,jn as f,o as p,t as m,zn as h}from"./client-CnjRWATJ.js";import{a as g,i as _,n as v,r as y,t as b}from"./create-runtime-stories-CuDbtWJx.js";import{t as x}from"./button-BeVJhn9t.js";import{t as S}from"./button-WqyvoQZP.js";import{t as C}from"./label-DOHQEcNU.js";import{t as w}from"./label-DkJtKPyW.js";import{t as T}from"./input-B_9rFd_s.js";import{t as E}from"./input-BcVlMs2R.js";import{a as D,d as O,l as k,n as A,p as j,r as M,s as N,t as P}from"./dialog-DI_mUjw3.js";function F(e,t){f(t,!1),p(),L(e,{name:`Default`,asChild:!0,children:(e,t)=>{P(e,{children:(e,t)=>{var n=R(),o=a(n);M(o,{child:(e,t)=>{x(e,l(()=>t?.().props,{variant:`outline`,children:(e,t)=>{h(),u(e,i(`Edit Profile`))},$$slots:{default:!0}}))},$$slots:{child:!0}}),N(d(o,2),{children:(e,t)=>{var n=z(),o=a(n);k(o,{children:(e,t)=>{var n=R(),r=a(n);j(r,{children:(e,t)=>{h(),u(e,i(`Edit profile`))},$$slots:{default:!0}}),D(d(r,2),{children:(e,t)=>{h(),u(e,i(`Make changes to your profile here. Click save when you're done.`))},$$slots:{default:!0}}),u(e,n)},$$slots:{default:!0}});var s=d(o,2),l=c(s),f=c(l);C(f,{for:`name`,children:(e,t)=>{h(),u(e,i(`Name`))},$$slots:{default:!0}}),T(d(f,2),{id:`name`,value:`Pedro Duarte`}),r(l);var p=d(l,2),m=c(p);C(m,{for:`username`,children:(e,t)=>{h(),u(e,i(`Username`))},$$slots:{default:!0}}),T(d(m,2),{id:`username`,value:`@peduarte`}),r(p),r(s),O(d(s,2),{children:(e,t)=>{x(e,{type:`submit`,children:(e,t)=>{h(),u(e,i(`Save changes`))},$$slots:{default:!0}})},$$slots:{default:!0}}),u(e,n)},$$slots:{default:!0}}),u(e,n)},$$slots:{default:!0}})},$$slots:{default:!0},parameters:{__svelteCsf:{rawCode:`<Dialog.Root>
    <Dialog.Trigger>
        {#snippet child({ props })}
            <Button {...props} variant="outline">Edit Profile</Button>
        {/snippet}
    </Dialog.Trigger>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Edit profile</Dialog.Title>
            <Dialog.Description>
                Make changes to your profile here. Click save when you're done.
            </Dialog.Description>
        </Dialog.Header>
        <div class="grid gap-4 py-4">
            <div class="grid gap-2">
                <Label for="name">Name</Label>
                <Input id="name" value="Pedro Duarte" />
            </div>
            <div class="grid gap-2">
                <Label for="username">Username</Label>
                <Input id="username" value="@peduarte" />
            </div>
        </div>
        <Dialog.Footer>
            <Button type="submit">Save changes</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>`}}}),n()}var I,L,R,z,B,V,H;e((()=>{t(),g(),s(),_(),A(),S(),E(),w(),m(),v(),I={title:`ui/Dialog`,component:P,tags:[`autodocs`]},{Story:L}=y(I),R=o(`<!> <!>`,1),z=o(`<!> <div class="grid gap-4 py-4"><div class="grid gap-2"><!> <!></div> <div class="grid gap-2"><!> <!></div></div> <!>`,1),F.__docgen={data:[],name:`dialog.stories.svelte`},B=b(F,I),V=[`Default`],H={...B.Default,tags:[`svelte-csf-v5`]}}))();export{H as Default,V as __namedExportsOrder,I as default};