import{i as e}from"./preload-helper-xPQekRTU.js";import{$n as t,An as n,Xn as r,jn as i,o as a,t as o}from"./client-CnjRWATJ.js";import{a as s,i as c,n as l,r as u,t as d}from"./create-runtime-stories-CuDbtWJx.js";import{i as f,t as p}from"./dist-oVThoU3D.js";import{i as m,n as h,t as g}from"./chart-DaLjcczC.js";function _(e,t){i(t,!1),a(),y(e,{name:`LineChart`,asChild:!0,children:(e,t)=>{m(e,{config:{},class:`h-52 w-full max-w-lg`,children:(e,t)=>{f(e,{x:`year`,get data(){return b},points:!0,labels:!1,series:[{key:`count`,color:`var(--chart-1)`}],padding:{top:16,bottom:32,left:32,right:16},tooltip:e=>{h(e,{})},$$slots:{tooltip:!0}})},$$slots:{default:!0}})},$$slots:{default:!0},parameters:{__svelteCsf:{rawCode:`<Chart.ChartContainer config={{}} class="h-52 w-full max-w-lg">
    <LineChart
        x="year"
        {data}
        points
        labels={false}
        series={[{ key: "count", color: "var(--chart-1)" }]}
        padding={{ top: 16, bottom: 32, left: 32, right: 16 }}>
        {#snippet tooltip()}
            <Chart.ChartTooltip />
        {/snippet}
    </LineChart>
</Chart.ChartContainer>`}}}),n()}var v,y,b,x,S,C;e((()=>{t(),s(),r(),c(),g(),p(),o(),l(),v={title:`ui/Chart`,component:m,tags:[`autodocs`]},{Story:y}=u(v),b=[{year:2020,count:12},{year:2021,count:28},{year:2022,count:19},{year:2023,count:41},{year:2024,count:35}],_.__docgen={data:[],name:`chart.stories.svelte`},x=d(_,v),S=[`LineChart`],C={...x.LineChart,tags:[`svelte-csf-v5`]}}))();export{C as LineChart,S as __namedExportsOrder,v as default};