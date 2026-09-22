import{i as e}from"./preload-helper-xPQekRTU.js";import{$ as t,$n as n,An as r,Et as i,Nt as a,Qt as o,St as s,Wt as c,Xn as l,bt as u,en as d,jn as f,o as p,t as m,vt as h,xt as g,zn as _}from"./client-CnjRWATJ.js";import{a as v,i as y,n as b,r as x,t as S}from"./create-runtime-stories-CuDbtWJx.js";import{c as C,f as w,g as T,i as E,m as D,n as O,o as k,t as A,u as j}from"./table-KHf8aXwl.js";function M(e,n){f(n,!1),p(),P(e,{name:`Default`,asChild:!0,children:(e,n)=>{T(e,{children:(e,n)=>{var r=I(),s=o(r);w(s,{children:(e,t)=>{_(),u(e,i(`A list of recent invoices.`))},$$slots:{default:!0}});var l=d(s,2);E(l,{children:(e,t)=>{O(e,{children:(e,t)=>{var n=I(),r=o(n);k(r,{class:`w-[100px]`,children:(e,t)=>{_(),u(e,i(`Invoice`))},$$slots:{default:!0}});var a=d(r,2);k(a,{children:(e,t)=>{_(),u(e,i(`Status`))},$$slots:{default:!0}});var s=d(a,2);k(s,{children:(e,t)=>{_(),u(e,i(`Method`))},$$slots:{default:!0}}),k(d(s,2),{class:`text-right`,children:(e,t)=>{_(),u(e,i(`Amount`))},$$slots:{default:!0}}),u(e,n)},$$slots:{default:!0}})},$$slots:{default:!0}});var f=d(l,2);D(f,{children:(e,n)=>{var r=g();t(o(r),1,()=>F,e=>e.invoice,(e,t)=>{O(e,{children:(e,n)=>{var r=I(),s=o(r);j(s,{class:`font-medium`,children:(e,n)=>{_();var r=i();c(()=>h(r,a(t).invoice)),u(e,r)},$$slots:{default:!0}});var l=d(s,2);j(l,{children:(e,n)=>{_();var r=i();c(()=>h(r,a(t).status)),u(e,r)},$$slots:{default:!0}});var f=d(l,2);j(f,{children:(e,n)=>{_();var r=i();c(()=>h(r,a(t).method)),u(e,r)},$$slots:{default:!0}}),j(d(f,2),{class:`text-right`,children:(e,n)=>{_();var r=i();c(()=>h(r,a(t).amount)),u(e,r)},$$slots:{default:!0}}),u(e,r)},$$slots:{default:!0}})}),u(e,r)},$$slots:{default:!0}}),C(d(f,2),{children:(e,t)=>{O(e,{children:(e,t)=>{var n=L(),r=o(n);j(r,{colspan:3,children:(e,t)=>{_(),u(e,i(`Total`))},$$slots:{default:!0}}),j(d(r,2),{class:`text-right`,children:(e,t)=>{_(),u(e,i(`$750.00`))},$$slots:{default:!0}}),u(e,n)},$$slots:{default:!0}})},$$slots:{default:!0}}),u(e,r)},$$slots:{default:!0}})},$$slots:{default:!0},parameters:{__svelteCsf:{rawCode:`<Table.Root>
    <Table.Caption>A list of recent invoices.</Table.Caption>
    <Table.Header>
        <Table.Row>
            <Table.Head class="w-[100px]">Invoice</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>Method</Table.Head>
            <Table.Head class="text-right">Amount</Table.Head>
        </Table.Row>
    </Table.Header>
    <Table.Body>
        {#each invoices as invoice (invoice.invoice)}
            <Table.Row>
                <Table.Cell class="font-medium">{invoice.invoice}</Table.Cell>
                <Table.Cell>{invoice.status}</Table.Cell>
                <Table.Cell>{invoice.method}</Table.Cell>
                <Table.Cell class="text-right">{invoice.amount}</Table.Cell>
            </Table.Row>
        {/each}
    </Table.Body>
    <Table.Footer>
        <Table.Row>
            <Table.Cell colspan={3}>Total</Table.Cell>
            <Table.Cell class="text-right">$750.00</Table.Cell>
        </Table.Row>
    </Table.Footer>
</Table.Root>`}}}),r()}var N,P,F,I,L,R,z,B;e((()=>{n(),v(),l(),y(),A(),m(),b(),N={title:`ui/Table`,component:T,tags:[`autodocs`]},{Story:P}=x(N),F=[{invoice:`INV001`,status:`Paid`,method:`Credit Card`,amount:`$250.00`},{invoice:`INV002`,status:`Pending`,method:`PayPal`,amount:`$150.00`},{invoice:`INV003`,status:`Unpaid`,method:`Bank Transfer`,amount:`$350.00`}],I=s(`<!> <!> <!> <!>`,1),L=s(`<!> <!>`,1),M.__docgen={data:[],name:`table.stories.svelte`},R=S(M,N),z=[`Default`],B={...R.Default,tags:[`svelte-csf-v5`]}}))();export{B as Default,z as __namedExportsOrder,N as default};