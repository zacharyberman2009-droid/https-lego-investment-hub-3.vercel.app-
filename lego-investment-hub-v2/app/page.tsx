"use client";
import {useEffect,useMemo,useState} from "react";
import {getInventory,money,pct,valueAt} from "@/lib/storage";
import {LegoItem} from "@/lib/types";

export default function Dashboard(){
 const [items,setItems]=useState<LegoItem[]>([]);
 useEffect(()=>{const load=()=>setItems(getInventory());load();window.addEventListener("inventory-change",load);return()=>window.removeEventListener("inventory-change",load)},[]);
 const stats=useMemo(()=>{
  const market=items.reduce((s,i)=>s+i.market*i.quantity,0),cost=items.reduce((s,i)=>s+i.cost*i.quantity,0),retail=items.reduce((s,i)=>s+i.storePrice*i.quantity,0);
  const prev=items.reduce((s,i)=>s+valueAt(i,30)*i.quantity,0);return{market,cost,retail,gain:market-cost,p30:prev?((market-prev)/prev)*100:0};
 },[items]);
 const movers=[...items].map(i=>({...i,change:(i.market-valueAt(i,30))/Math.max(valueAt(i,30),1)*100})).sort((a,b)=>b.change-a.change).slice(0,5);
 const bars=[0,7,14,21,30,45,60,75,90].reverse().map(d=>({d,v:items.reduce((s,i)=>s+valueAt(i,d)*i.quantity,0)}));const max=Math.max(...bars.map(b=>b.v),1),min=Math.min(...bars.map(b=>b.v),max); 
 return <>
 <div className="header"><div><div className="eyebrow">Portfolio command center</div><h1>LEGO Investment Dashboard</h1><div className="muted">Inventory value, market movement and holdings intelligence.</div></div><a className="btn accent" href="/inventory">+ Add LEGO Set</a></div>
 <div className="grid kpis">
  <div className="card kpi"><label>Market value</label><strong>{money(stats.market)}</strong><span className={`delta ${stats.p30>=0?"up":"down"}`}>{pct(stats.p30)} · 30 days</span></div>
  <div className="card kpi"><label>Cost basis</label><strong>{money(stats.cost)}</strong><span className="muted">Across {items.reduce((s,i)=>s+i.quantity,0)} sets</span></div>
  <div className="card kpi"><label>Unrealized gain</label><strong>{money(stats.gain)}</strong><span className={`delta ${stats.gain>=0?"up":"down"}`}>{stats.cost?pct(stats.gain/stats.cost*100):"0%"} return</span></div>
  <div className="card kpi"><label>Retail value</label><strong>{money(stats.retail)}</strong><span className="muted">Your current store prices</span></div>
 </div>
 <div className="grid two">
  <section className="card"><div className="section-title"><h2>Portfolio trend</h2><span className="muted">90-day indexed history</span></div><div className="chart">{bars.map((b,idx)=><div key={idx} className="bar" style={{height:`${35+((b.v-min)/Math.max(max-min,1))*145}px`}}><span>{idx===bars.length-1?"Now":`${b.d}d`}</span></div>)}</div></section>
  <section className="card"><div className="section-title"><h2>Top movers</h2><a href="/market" className="muted">View market →</a></div><div className="list">{movers.map(i=><div className="row" style={{gridTemplateColumns:"1.6fr .8fr"}} key={i.id}><div className="name"><b>{i.name}</b><small>#{i.setNumber} · {i.quantity} owned</small></div><b className={i.change>=0?"up":"down"}>{pct(i.change)}</b></div>)}</div></section>
 </div>
 <div className="grid two">
  <section className="card"><div className="section-title"><h2>Inventory exposure</h2><span className="muted">Largest positions by market value</span></div><div className="list">{[...items].sort((a,b)=>b.market*b.quantity-a.market*a.quantity).slice(0,5).map(i=><div className="row" key={i.id}><div className="name"><b>{i.name}</b><small>{i.theme} · {i.condition}</small></div><span>{i.quantity} units</span><span>{money(i.market)}</span><b>{money(i.market*i.quantity)}</b></div>)}</div></section>
  <section className="card"><div className="section-title"><h2>Intelligence alerts</h2></div><div className="news-item"><span className="tag">Portfolio</span><h3>{movers[0]?.name||"Your holdings"} is your strongest 30-day mover</h3><p>Price-history snapshots are retained so changes remain visible instead of being overwritten by each market refresh.</p></div><div className="news-item"><span className="tag">Pricing</span><h3>Store price and market value stay separate</h3><p>Market feeds can update automatically while your actual in-store asking price remains under your control.</p></div></section>
 </div></>;
}
