import{i as e}from"./preload-helper-xPQekRTU.js";import{$n as t,An as n,Bn as r,Et as i,It as a,Qt as o,St as s,Xn as c,Zt as l,a as u,bn as d,bt as f,en as p,jn as m,o as h,t as g,vn as _,yn as v,zn as y}from"./client-CnjRWATJ.js";import{a as b,i as x,l as S,o as C,r as w,t as T}from"./adapters-C21fnReT.js";import{a as E,i as D,n as O,r as k,t as A}from"./create-runtime-stories-CuDbtWJx.js";import{t as j}from"./button-BeVJhn9t.js";import{t as M}from"./button-WqyvoQZP.js";import{a as N,d as P,l as F,n as I,o as L,s as R,t as z}from"./form-D4pSvBUb.js";import{a as B,i as V}from"./auth-C3TsOG_o.js";import{t as H}from"./input-B_9rFd_s.js";import{t as U}from"./input-BcVlMs2R.js";function W(e,t){m(t,!1);let s=()=>v(T,`$formData`,c),[c,g]=_(),b=S(C(w(B)),{validators:x(B),SPA:!0}),{form:T}=b;h(),K(e,{name:`Default`,asChild:!0,children:(e,t)=>{var n=Y(),c=l(n);N(c,{get form(){return b},name:`username`,children:(e,t)=>{var n=J(),r=o(n);z(r,{children:(e,t)=>{let n=()=>t?.().props;var r=q(),c=o(r);F(c,{children:(e,t)=>{y(),f(e,i(`Username`))},$$slots:{default:!0}}),H(p(c,2),u(n,{get value(){return s().username},set value(e){d(T,a(s).username=e,a(s))},$$legacy:!0})),f(e,r)},$$slots:{default:!0}});var c=p(r,2);P(c,{children:(e,t)=>{y(),f(e,i(`This is your public display name.`))},$$slots:{default:!0}}),R(p(c,2),{}),f(e,n)},$$slots:{default:!0}});var m=p(c,2);N(m,{get form(){return b},name:`password`,children:(e,t)=>{var n=q(),r=o(n);z(r,{children:(e,t)=>{let n=()=>t?.().props;var r=q(),c=o(r);F(c,{children:(e,t)=>{y(),f(e,i(`Password`))},$$slots:{default:!0}}),H(p(c,2),u(n,{type:`password`,get value(){return s().password},set value(e){d(T,a(s).password=e,a(s))},$$legacy:!0})),f(e,r)},$$slots:{default:!0}}),R(p(r,2),{}),f(e,n)},$$slots:{default:!0}}),j(p(m,2),{type:`submit`,children:(e,t)=>{y(),f(e,i(`Submit`))},$$slots:{default:!0}}),r(n),f(e,n)},$$slots:{default:!0},parameters:{__svelteCsf:{rawCode:`<form class="flex w-full max-w-sm flex-col gap-4">
    <Form.Field {form} name="username">
        <Form.Control>
            {#snippet children({ props })}
                <Form.Label>Username</Form.Label>
                <Input {...props} bind:value={$formData.username} />
            {/snippet}
        </Form.Control>
        <Form.Description>This is your public display name.</Form.Description>
        <Form.FieldErrors />
    </Form.Field>
    <Form.Field {form} name="password">
        <Form.Control>
            {#snippet children({ props })}
                <Form.Label>Password</Form.Label>
                <Input {...props} type="password" bind:value={$formData.password} />
            {/snippet}
        </Form.Control>
        <Form.FieldErrors />
    </Form.Field>
    <Button type="submit">Submit</Button>
</form>`}}}),n(),g()}var G,K,q,J,Y,X,Z,Q;e((()=>{t(),E(),c(),D(),L(),I(),U(),M(),b(),T(),V(),g(),O(),G={title:`ui/Form`,component:N,tags:[`autodocs`]},{Story:K}=k(G),q=s(`<!> <!>`,1),J=s(`<!> <!> <!>`,1),Y=s(`<form class="flex w-full max-w-sm flex-col gap-4"><!> <!> <!></form>`),W.__docgen={data:[],name:`form.stories.svelte`},X=A(W,G),Z=[`Default`],Q={...X.Default,tags:[`svelte-csf-v5`]}}))();export{Q as Default,Z as __namedExportsOrder,G as default};