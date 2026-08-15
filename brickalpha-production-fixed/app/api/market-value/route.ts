import {NextRequest,NextResponse} from "next/server";
import OAuth from "oauth-1.0a";
import crypto from "crypto";
import {normalizeSetNumber,researchLinks} from "@/lib/research";
import {MarketSource} from "@/lib/types";

type WeightedSource=MarketSource&{weight:number};
function numeric(...values:unknown[]){for(const v of values){const n=Number(v);if(Number.isFinite(n)&&n>0)return n}return 0}
function cents(v:unknown){const n=Number(v);return Number.isFinite(n)&&n>0?n/100:0}

async function brickLink(setNumber:string,condition:"N"|"U",guide:"sold"|"stock"){
 const consumerKey=process.env.BRICKLINK_CONSUMER_KEY,consumerSecret=process.env.BRICKLINK_CONSUMER_SECRET,token=process.env.BRICKLINK_TOKEN,tokenSecret=process.env.BRICKLINK_TOKEN_SECRET;
 if(!consumerKey||!consumerSecret||!token||!tokenSecret)return null;
 const oauth=new OAuth({consumer:{key:consumerKey,secret:consumerSecret},signature_method:"HMAC-SHA1",hash_function(base,key){return crypto.createHmac("sha1",key).update(base).digest("base64")}});
 const no=normalizeSetNumber(setNumber); const url=`https://api.bricklink.com/api/store/v1/items/SET/${encodeURIComponent(no)}/price?guide_type=${guide}&new_or_used=${condition}&currency_code=USD`;
 const auth=oauth.toHeader(oauth.authorize({url,method:"GET"},{key:token,secret:tokenSecret}));
 const r=await fetch(url,{headers:{Authorization:auth.Authorization},cache:"no-store"}); const body=await r.json().catch(()=>null);
 if(!r.ok||body?.meta?.code!==200)return null; return body.data;
}
async function brickEconomy(setNumber:string){
 const key=process.env.BRICKECONOMY_API_KEY;if(!key)return null;
 const r=await fetch(`https://www.brickeconomy.com/api/v1/set/${encodeURIComponent(normalizeSetNumber(setNumber))}?currency=USD`,{headers:{accept:"application/json","x-apikey":key,"User-Agent":"BrickAlpha/1.0 LEGO inventory valuation"},cache:"no-store"});
 if(!r.ok)return null;const body=await r.json().catch(()=>null);return body?.data||null;
}
async function priceCharting(setNumber:string){
 const token=process.env.PRICECHARTING_TOKEN;if(!token)return null;
 const q=encodeURIComponent(`LEGO ${setNumber}`);const r=await fetch(`https://www.pricecharting.com/api/product?t=${encodeURIComponent(token)}&q=${q}`,{cache:"no-store"});
 if(!r.ok)return null;const body=await r.json().catch(()=>null);return body?.status==="success"?body:null;
}

export async function GET(req:NextRequest){
 const setNumber=req.nextUrl.searchParams.get("setNumber")?.trim();const condition=req.nextUrl.searchParams.get("condition")==="U"?"U":"N";
 if(!setNumber)return NextResponse.json({error:"Missing setNumber"},{status:400});
 const fetchedAt=new Date().toISOString();
 const [sold,stock,econ,pc]=await Promise.all([brickLink(setNumber,condition,"sold").catch(()=>null),brickLink(setNumber,condition,"stock").catch(()=>null),brickEconomy(setNumber).catch(()=>null),priceCharting(setNumber).catch(()=>null)]);
 const sources:WeightedSource[]=[];
 if(sold){const value=numeric(sold.qty_avg_price,sold.avg_price);if(value)sources.push({source:"bricklink_sold",label:"BrickLink 6-mo sold",value,kind:"sold",detail:`${sold.unit_quantity||0} sale records in guide`,fetchedAt,weight:50})}
 if(econ){const value=condition==="N"?numeric(econ.current_value_new):numeric(econ.current_value_used,econ.current_value_used_low);if(value)sources.push({source:"brickeconomy",label:"BrickEconomy current value",value,kind:"estimate",detail:condition==="N"?"New/sealed estimate":"Used complete estimate",fetchedAt,weight:30})}
 if(pc){const value=condition==="N"?cents(pc["new-price"]):numeric(cents(pc["cib-price"]),cents(pc["loose-price"]));if(value)sources.push({source:"pricecharting",label:"PriceCharting guide",value,kind:"estimate",detail:String(pc["product-name"]||"Matched LEGO product"),fetchedAt,weight:20})}
 if(stock){const value=numeric(stock.qty_avg_price,stock.avg_price);if(value)sources.push({source:"bricklink_stock",label:"BrickLink current listings",value,kind:"listing",detail:`${stock.unit_quantity||0} store inventories`,fetchedAt,weight:10})}
 const totalWeight=sources.reduce((s,x)=>s+x.weight,0);const market=totalWeight?sources.reduce((s,x)=>s+x.value*x.weight,0)/totalWeight:0;const values=sources.map(s=>s.value);
 return NextResponse.json({setNumber:normalizeSetNumber(setNumber),condition,market:market?Number(market.toFixed(2)):null,low:values.length?Number(Math.min(...values).toFixed(2)):null,high:values.length?Number(Math.max(...values).toFixed(2)):null,sources:sources.map(({weight,...s})=>s),researchLinks:researchLinks(setNumber),integrations:{bricklink:Boolean(process.env.BRICKLINK_CONSUMER_KEY&&process.env.BRICKLINK_CONSUMER_SECRET&&process.env.BRICKLINK_TOKEN&&process.env.BRICKLINK_TOKEN_SECRET),brickeconomy:Boolean(process.env.BRICKECONOMY_API_KEY),pricecharting:Boolean(process.env.PRICECHARTING_TOKEN)},methodology:"Automatic values use configured official APIs. Public research links are always returned for human-visible marketplace checks. Weighted estimate favors completed/sold market evidence over estimates and active listings.",updatedAt:fetchedAt});
}
