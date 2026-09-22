import{i as e}from"./preload-helper-xPQekRTU.js";import{$n as t,An as n,Bn as r,Et as i,Qt as a,St as o,Xn as s,Zt as c,bt as l,en as u,jn as d,o as f,t as p,zn as m}from"./client-CnjRWATJ.js";import{a as h,i as g,n as _,r as v,t as y}from"./create-runtime-stories-CuDbtWJx.js";import{t as b}from"./button-BeVJhn9t.js";import{t as x}from"./button-WqyvoQZP.js";import{t as S}from"./label-DOHQEcNU.js";import{t as C}from"./label-DkJtKPyW.js";import{t as w}from"./input-B_9rFd_s.js";import{t as T}from"./input-BcVlMs2R.js";import{n as E,t as D}from"./form-base-5K6oGloD.js";function O(e,t){d(t,!1),f();var o=P(),s=a(o);A(s,{name:`Default`,asChild:!0,children:(e,t)=>{var n=M();D(c(n),{title:`Change password`,description:`Update your account password.`,content:e=>{var t=j(),n=c(t);S(n,{for:`password`,children:(e,t)=>{m(),l(e,i(`New password`))},$$slots:{default:!0}}),w(u(n,2),{id:`password`,type:`password`}),r(t),l(e,t)},footer:e=>{b(e,{type:`submit`,children:(e,t)=>{m(),l(e,i(`Save`))},$$slots:{default:!0}})},$$slots:{content:!0,footer:!0}}),r(n),l(e,n)},$$slots:{default:!0},parameters:{__svelteCsf:{rawCode:`<div class="w-full max-w-sm">
    <FormBase title="Change password" description="Update your account password.">
        {#snippet content()}
            <div class="space-y-2">
                <Label for="password">New password</Label>
                <Input id="password" type="password" />
            </div>
        {/snippet}
        {#snippet footer()}
            <Button type="submit">Save</Button>
        {/snippet}
    </FormBase>
</div>`}}}),A(u(s,2),{name:`NoDescription`,asChild:!0,children:(e,t)=>{var n=M();D(c(n),{title:`Passkeys`,content:e=>{l(e,N())},$$slots:{content:!0}}),r(n),l(e,n)},$$slots:{default:!0},parameters:{__svelteCsf:{rawCode:`<div class="w-full max-w-sm">
    <FormBase title="Passkeys">
        {#snippet content()}
            <p class="text-muted-foreground text-sm">No passkeys registered yet.</p>
        {/snippet}
    </FormBase>
</div>`}}}),l(e,o),n()}var k,A,j,M,N,P,F,I,L,R;e((()=>{t(),h(),s(),g(),E(),x(),T(),C(),p(),_(),k={title:`auth/FormBase`,component:D,tags:[`autodocs`]},{Story:A}=v(k),j=o(`<div class="space-y-2"><!> <!></div>`),M=o(`<div class="w-full max-w-sm"><!></div>`),N=o(`<p class="text-muted-foreground text-sm">No passkeys registered yet.</p>`),P=o(`<!> <!>`,1),O.__docgen={data:[],name:`form-base.stories.svelte`},F=y(O,k),I=[`Default`,`NoDescription`],L={...F.Default,tags:[`svelte-csf-v5`]},R={...F.NoDescription,tags:[`svelte-csf-v5`]}}))();export{L as Default,R as NoDescription,I as __namedExportsOrder,k as default};