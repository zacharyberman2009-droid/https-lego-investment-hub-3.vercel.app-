import {NextRequest,NextResponse} from "next/server";
import OAuth from "oauth-1.0a";
import crypto from "crypto";

type Source = {source:string;label:string;value:number;kind:"sold"|"estimate"|"listing";detail?:string;weight:number};

function setNo(value:string){
  const clean=value.trim();
  return clean.includes("-")?clean:`${clean}-1`;
}

async function brickLinkPrice(setNumber:string, condition:"N"|"U", guide:"sold"|"stock"){
  const consumerKey=process.env.BRICKLINK_CONSUMER_KEY;
  const consumerSecret=process.env.BRICKLINK_CONSUMER_SECRET;
  const token=process.env.BRICKLINK_TOKEN;
  const tokenSecret=process.env.BRICKLINK_TOKEN_SECRET;
  if(!consumerKey||!consumerSecret||!token||!tokenSecret) return null;
  const oauth=new OAuth({consumer:{key:consumerKey,secret:consumerSecret},signature_method:"HMAC-SHA1",hash_function(base,key){return crypto.createHmac("sha1",key).update(base).digest("base64")}});
  const no=setNo(setNumber);
  const url=`https://api.bricklink.com/api/store/v1/items/SET/${encodeURIComponent(no)}/price?guide_type=${guide}&new_or_used=${condition}&currency_code=USD`;
  const request={url,method:"GET"};
  const auth=oauth.toHeader(oauth.authorize(request,{key:token,secret:tokenSecret}));
  const r=await fetch(url,{headers:{Authorization:auth.Authorization},cache:"no-store"});
  const body=await r.json().catch(()=>null);
  if(!r.ok||body?.meta?.code!==200) return null;
  return body.data;
}

async function brickEconomy(setNumber:string){
  const key=process.env.BRICKECONOMY_API_KEY;
  if(!key) return null;
  const r=await fetch(`https://www.brickeconomy.com/api/v1/set/${encodeURIComponent(setNo(setNumber))}?currency=USD`,{
    headers:{accept:"application/json","x-apikey":key,"User-Agent":"BrickAlpha LEGO Inventory"},cache:"no-store"
  });
  if(!r.ok) return null;
  const body=await r.json().catch(()=>null);
  return body?.data||null;
}

function numeric(...values:any[]){
  for(const value of values){const n=Number(value);if(Number.isFinite(n)&&n>0)return n;}
  return 0;
}

export async function GET(req:NextRequest){
  const setNumber=req.nextUrl.searchParams.get("setNumber")?.trim();
  const condition=req.nextUrl.searchParams.get("condition")==="U"?"U":"N";
  if(!setNumber)return NextResponse.json({error:"Missing setNumber"},{status:400});

  const [sold,stock,economy]=await Promise.all([
    brickLinkPrice(setNumber,condition,"sold").catch(()=>null),
    brickLinkPrice(setNumber,condition,"stock").catch(()=>null),
    brickEconomy(setNumber).catch(()=>null)
  ]);

  const sources:Source[]=[];
  if(sold){
    const value=numeric(sold.qty_avg_price,sold.avg_price);
    if(value)sources.push({source:"bricklink_sold",label:"BrickLink 6-mo sold",value,kind:"sold",weight:.60,detail:`${sold.unit_quantity||0} units in guide`});
  }
  if(economy){
    const value=condition==="N"?numeric(economy.current_value_new):numeric(economy.current_value_used,economy.current_value_used_low);
    if(value)sources.push({source:"brickeconomy",label:"BrickEconomy current value",value,kind:"estimate",weight:.30,detail:condition==="N"?"New/sealed estimate":"Used estimate"});
  }
  if(stock){
    const value=numeric(stock.qty_avg_price,stock.avg_price);
    if(value)sources.push({source:"bricklink_stock",label:"BrickLink current listings",value,kind:"listing",weight:.10,detail:`${stock.unit_quantity||0} listed units`});
  }

  if(!sources.length){
    return NextResponse.json({error:"No live market sources are configured or returned data. Add BrickLink credentials and/or a BrickEconomy API key in Vercel environment variables."},{status:503});
  }

  const totalWeight=sources.reduce((s,x)=>s+x.weight,0);
  const weighted=sources.reduce((s,x)=>s+x.value*x.weight,0)/totalWeight;
  const values=sources.map(s=>s.value);
  return NextResponse.json({
    market:Number(weighted.toFixed(2)),
    low:Number(Math.min(...values).toFixed(2)),
    high:Number(Math.max(...values).toFixed(2)),
    sources:sources.map(({weight,...s})=>s),
    methodology:"Weighted blend favoring actual BrickLink sold prices, then BrickEconomy current value, then current BrickLink listings.",
    updatedAt:new Date().toISOString()
  });
}
