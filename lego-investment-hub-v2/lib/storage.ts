"use client";
import { LegoItem, WatchItem } from "./types";
import { seedInventory } from "./seed";

const INV="lih_inventory_v1", WATCH="lih_watch_v1";
export function getInventory():LegoItem[]{
  if(typeof window==="undefined") return seedInventory;
  const raw=localStorage.getItem(INV);
  if(!raw){localStorage.setItem(INV,JSON.stringify(seedInventory));return seedInventory;}
  try{return JSON.parse(raw)}catch{return seedInventory}
}
export function saveInventory(items:LegoItem[]){localStorage.setItem(INV,JSON.stringify(items));window.dispatchEvent(new Event("inventory-change"));}
export function getWatchlist():WatchItem[]{if(typeof window==="undefined")return [];try{return JSON.parse(localStorage.getItem(WATCH)||"[]")}catch{return []}}
export function saveWatchlist(items:WatchItem[]){localStorage.setItem(WATCH,JSON.stringify(items));}
export function money(v:number){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(v)}
export function pct(v:number){return `${v>=0?"+":""}${v.toFixed(1)}%`}
export function valueAt(item:LegoItem, days:number){const target=Date.now()-days*86400000;const points=[...(item.history||[])].sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime());let best=points[0]?.market??item.market;for(const p of points){if(new Date(p.date).getTime()<=target)best=p.market;else break;}return best;}
