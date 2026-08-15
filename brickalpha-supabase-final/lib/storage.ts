"use client";
import { LegoItem, WatchItem, MarketSource, PriceSnapshot } from "./types";
import { supabase, ensureSupabaseUser } from "./supabase";

const LOCAL_INV_KEYS=["lih_inventory_v2","lih_inventory_v1"];
const LOCAL_WATCH_KEY="lih_watch_v1";

function dbToItem(row:any, history:PriceSnapshot[]=[]):LegoItem{
  return {
    id:row.id,setNumber:row.set_number,name:row.name,theme:row.theme||"",year:row.year??undefined,
    condition:row.condition,quantity:Number(row.quantity||1),cost:Number(row.cost||0),market:Number(row.market||0),
    storePrice:Number(row.store_price||0),status:row.status,location:row.location||"",imageUrl:row.image_url||undefined,
    notes:row.notes||"",lastUpdated:row.last_updated||undefined,marketSources:(row.market_sources||[]) as MarketSource[],
    refreshRequested:Boolean(row.refresh_requested),refreshRequestedAt:row.refresh_requested_at||undefined,history
  };
}
function itemToDb(item:LegoItem,userId:string){return{
  id:item.id,set_number:item.setNumber,name:item.name,theme:item.theme||null,year:item.year??null,condition:item.condition,
  quantity:item.quantity,cost:item.cost,market:item.market,store_price:item.storePrice,status:item.status,location:item.location||null,
  notes:item.notes||null,image_url:item.imageUrl||null,market_sources:item.marketSources||[],last_updated:item.lastUpdated||null,
  refresh_requested:Boolean(item.refreshRequested),refresh_requested_at:item.refreshRequestedAt||null,owner_id:userId,updated_at:new Date().toISOString()
}}

export function getLocalInventoryBackup():LegoItem[]{
  if(typeof window==="undefined")return[];
  for(const key of LOCAL_INV_KEYS){const raw=localStorage.getItem(key);if(raw){try{return JSON.parse(raw)}catch{}}}
  return[];
}
export function getLocalWatchlistBackup():WatchItem[]{if(typeof window==="undefined")return[];try{return JSON.parse(localStorage.getItem(LOCAL_WATCH_KEY)||"[]")}catch{return[]}}

export async function getInventory():Promise<LegoItem[]>{
  const user=await ensureSupabaseUser();
  const {data:rows,error}=await supabase.from("inventory_items").select("*").eq("owner_id",user.id).order("created_at",{ascending:false});
  if(error)throw new Error(error.message);
  if(!rows?.length)return[];
  const ids=rows.map(r=>r.id);
  const {data:hist,error:histErr}=await supabase.from("price_history").select("inventory_id,price_date,market").eq("owner_id",user.id).in("inventory_id",ids).order("price_date",{ascending:true});
  if(histErr)throw new Error(histErr.message);
  const byId=new Map<string,PriceSnapshot[]>();
  for(const h of hist||[]){const arr=byId.get(h.inventory_id)||[];arr.push({date:h.price_date,market:Number(h.market)});byId.set(h.inventory_id,arr)}
  return rows.map((r:any)=>dbToItem(r,byId.get(r.id)||[]));
}

export async function upsertInventoryItem(item:LegoItem){
  const user=await ensureSupabaseUser();
  const {error}=await supabase.from("inventory_items").upsert(itemToDb(item,user.id));if(error)throw new Error(error.message);
  const snapshots=item.history||[];
  if(snapshots.length){const payload=snapshots.map(h=>({inventory_id:item.id,price_date:h.date,market:h.market,owner_id:user.id}));const {error:hErr}=await supabase.from("price_history").upsert(payload,{onConflict:"inventory_id,price_date"});if(hErr)throw new Error(hErr.message)}
  window.dispatchEvent(new Event("inventory-change"));
}
export async function deleteInventoryItem(id:string){const user=await ensureSupabaseUser();const {error}=await supabase.from("inventory_items").delete().eq("id",id).eq("owner_id",user.id);if(error)throw new Error(error.message);window.dispatchEvent(new Event("inventory-change"))}
export async function importLocalInventoryIfNeeded(){
  const remote=await getInventory();if(remote.length)return{imported:0,items:remote};
  const local=getLocalInventoryBackup();if(!local.length)return{imported:0,items:remote};
  for(const item of local)await upsertInventoryItem(item);
  return{imported:local.length,items:await getInventory()};
}
export async function requestPriceRefresh(ids?:string[]){
  const user=await ensureSupabaseUser();const now=new Date().toISOString();let q=supabase.from("inventory_items").update({refresh_requested:true,refresh_requested_at:now}).eq("owner_id",user.id);if(ids?.length)q=q.in("id",ids);const{error}=await q;if(error)throw new Error(error.message);window.dispatchEvent(new Event("inventory-change"))
}
export async function requestStalePriceRefresh(hours=24){
  const user=await ensureSupabaseUser();const cutoff=new Date(Date.now()-hours*3600000).toISOString(),now=new Date().toISOString();
  const {data,error}=await supabase.from("inventory_items").select("id,last_updated").eq("owner_id",user.id);if(error)throw new Error(error.message);
  const ids=(data||[]).filter((r:any)=>!r.last_updated||r.last_updated<cutoff).map((r:any)=>r.id);if(ids.length){const{error:uErr}=await supabase.from("inventory_items").update({refresh_requested:true,refresh_requested_at:now}).eq("owner_id",user.id).in("id",ids);if(uErr)throw new Error(uErr.message)}return ids.length;
}

export async function getWatchlist():Promise<WatchItem[]>{const user=await ensureSupabaseUser();const{data,error}=await supabase.from("watchlist_items").select("*").eq("owner_id",user.id).order("created_at",{ascending:false});if(error)throw new Error(error.message);return(data||[]).map((r:any)=>({id:r.id,setNumber:r.set_number,name:r.name,targetBuyPrice:Number(r.target_price||0),currentMarket:Number(r.current_price||0),notes:r.notes||""}))}
export async function upsertWatchItem(item:WatchItem){const user=await ensureSupabaseUser();const{error}=await supabase.from("watchlist_items").upsert({id:item.id,set_number:item.setNumber,name:item.name,target_price:item.targetBuyPrice,current_price:item.currentMarket,notes:item.notes||null,owner_id:user.id,updated_at:new Date().toISOString()});if(error)throw new Error(error.message)}
export async function deleteWatchItem(id:string){const user=await ensureSupabaseUser();const{error}=await supabase.from("watchlist_items").delete().eq("id",id).eq("owner_id",user.id);if(error)throw new Error(error.message)}

export function money(v:number){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(Number.isFinite(v)?v:0)}
export function pct(v:number){return `${v>=0?"+":""}${v.toFixed(1)}%`}
export function valueAt(item:LegoItem,days:number){const target=Date.now()-days*86400000;const points=[...(item.history||[])].sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime());let best=points[0]?.market??item.market;for(const p of points){if(new Date(p.date).getTime()<=target)best=p.market;else break}return best}
