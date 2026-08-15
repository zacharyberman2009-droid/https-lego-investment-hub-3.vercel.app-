import crypto from 'node:crypto';
const enc=s=>encodeURIComponent(String(s)).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
const norm=v=>{const s=String(v||'').trim();return s.includes('-')?s:`${s}-1`};
function median(xs){const a=xs.filter(Number.isFinite).sort((a,b)=>a-b);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2}
function trimmedAverage(xs){let a=xs.filter(x=>Number.isFinite(x)&&x>0).sort((a,b)=>a-b);if(a.length>=8){const k=Math.floor(a.length*.15);a=a.slice(k,a.length-k)}return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}
function oauthHeader(url,query){
  const ck=process.env.BRICKLINK_CONSUMER_KEY,cs=process.env.BRICKLINK_CONSUMER_SECRET,tv=process.env.BRICKLINK_TOKEN_VALUE,ts=process.env.BRICKLINK_TOKEN_SECRET;
  const oauth={oauth_consumer_key:ck,oauth_token:tv,oauth_signature_method:'HMAC-SHA1',oauth_timestamp:String(Math.floor(Date.now()/1000)),oauth_nonce:crypto.randomBytes(12).toString('hex'),oauth_version:'1.0'};
  const all={...query,...oauth};
  const param=Object.keys(all).sort().map(k=>`${enc(k)}=${enc(all[k])}`).join('&');
  const base=`GET&${enc(url)}&${enc(param)}`;
  const key=`${enc(cs)}&${enc(ts)}`;
  oauth.oauth_signature=crypto.createHmac('sha1',key).update(base).digest('base64');
  return 'OAuth realm="", '+Object.keys(oauth).sort().map(k=>`${enc(k)}="${enc(oauth[k])}"`).join(', ');
}
async function bricklink(setNumber,condition,guideType){
  if(!(process.env.BRICKLINK_CONSUMER_KEY&&process.env.BRICKLINK_CONSUMER_SECRET&&process.env.BRICKLINK_TOKEN_VALUE&&process.env.BRICKLINK_TOKEN_SECRET))throw new Error('BrickLink not configured');
  const base=`https://api.bricklink.com/api/store/v1/items/SET/${encodeURIComponent(setNumber)}/price`;
  const query={guide_type:guideType,new_or_used:condition==='used'?'U':'N',currency_code:'USD'};
  const qs=new URLSearchParams(query).toString();
  const r=await fetch(`${base}?${qs}`,{headers:{Authorization:oauthHeader(base,query),Accept:'application/json'}});
  const j=await r.json().catch(()=>({}));
  if(!r.ok||!j.data)throw new Error(j?.meta?.message||`BrickLink ${guideType} failed`);
  const d=j.data;
  const value=Number(d.qty_avg_price||d.avg_price||0);
  if(!value)throw new Error(`BrickLink ${guideType} returned no price`);
  return {value,label:guideType==='sold'?'BrickLink 6-month sold':'BrickLink current listings',note:guideType==='sold'?`${d.unit_quantity||0} units in the guide · quantity-weighted average`:`${d.unit_quantity||0} active units · quantity-weighted average`,weight:guideType==='sold'?0.60:0.10};
}
async function brickeconomy(setNumber,condition){
  const key=process.env.BRICKECONOMY_API_KEY;if(!key)throw new Error('BrickEconomy not configured');
  const r=await fetch(`https://www.brickeconomy.com/api/v1/set/${encodeURIComponent(setNumber)}?currency=USD`,{headers:{Accept:'application/json','User-Agent':'LEGO-Investment-Hub/4.0','x-apikey':key}});
  const j=await r.json().catch(()=>({}));if(!r.ok||!j.data)throw new Error(j?.message||'BrickEconomy failed');
  const d=j.data,value=Number(condition==='used'?d.current_value_used:d.current_value_new);
  if(!value)throw new Error('BrickEconomy returned no value');
  return {value,label:'BrickEconomy valuation',note:`Current ${condition==='used'?'used complete':'new sealed'} estimate${d.rolling_growth_12months!=null?` · 12m growth ${Number(d.rolling_growth_12months).toFixed(1)}%`:''}`,weight:0.25,history:condition==='used'?d.price_events_used:d.price_events_new};
}
async function ebayToken(){
  const id=process.env.EBAY_CLIENT_ID,secret=process.env.EBAY_CLIENT_SECRET;if(!(id&&secret))throw new Error('eBay not configured');
  const r=await fetch('https://api.ebay.com/identity/v1/oauth2/token',{method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope'});
  const j=await r.json().catch(()=>({}));if(!r.ok||!j.access_token)throw new Error('eBay token failed');return j.access_token;
}
async function ebay(setNumber,condition){
  const token=await ebayToken();const q=`LEGO ${setNumber.replace(/-1$/,'')} ${condition==='used'?'used complete':'new sealed'}`;
  const url=new URL('https://api.ebay.com/buy/browse/v1/item_summary/search');url.searchParams.set('q',q);url.searchParams.set('limit','30');url.searchParams.set('filter','buyingOptions:{FIXED_PRICE},priceCurrency:USD');
  const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`,'X-EBAY-C-MARKETPLACE-ID':process.env.EBAY_MARKETPLACE_ID||'EBAY_US',Accept:'application/json'}});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error('eBay search failed');
  const vals=(j.itemSummaries||[]).map(x=>Number(x?.price?.value)).filter(x=>Number.isFinite(x)&&x>0);const value=trimmedAverage(vals);if(!value)throw new Error('eBay returned no usable listings');
  return {value,label:'eBay active listings',note:`Trimmed average of ${vals.length} current fixed-price listings`,weight:0.05};
}
function blend(sources){
  if(!sources.length)return null;
  const vals=sources.map(s=>s.value),med=median(vals);let kept=sources;
  if(sources.length>=3&&med){const filtered=sources.filter(s=>Math.abs(s.value-med)/med<=0.55);if(filtered.length>=2)kept=filtered}
  const total=kept.reduce((s,x)=>s+x.weight,0)||1;const estimate=kept.reduce((s,x)=>s+x.value*(x.weight/total),0);
  return {estimate:Math.round(estimate*100)/100,kept};
}
export default async function handler(req,res){
  const setNumber=norm(req.query.set),condition=req.query.condition==='used'?'used':'new';if(!setNumber)return res.status(400).json({error:'Missing set number.'});
  const jobs=[['BrickLink sold',()=>bricklink(setNumber,condition,'sold')],['BrickEconomy',()=>brickeconomy(setNumber,condition)],['BrickLink listings',()=>bricklink(setNumber,condition,'stock')],['eBay',()=>ebay(setNumber,condition)]];
  const settled=await Promise.all(jobs.map(async([name,fn])=>{try{return {ok:true,data:await fn()}}catch(e){return {ok:false,name,error:e.message}}}));
  const sources=settled.filter(x=>x.ok).map(x=>x.data),warnings=settled.filter(x=>!x.ok).map(x=>`${x.name}: ${x.error}`),b=blend(sources);
  if(!b)return res.status(503).json({error:'No pricing source is configured or returned a usable price.',warnings});
  const confidence=b.kept.some(x=>x.label.includes('6-month sold'))?(b.kept.length>=2?'High':'Medium'):(b.kept.length>=2?'Medium':'Low');
  res.setHeader('Cache-Control','s-maxage=1800, stale-while-revalidate=7200');
  return res.status(200).json({setNumber,condition,estimate:b.estimate,confidence,sourceCount:b.kept.length,sources:b.kept.map(({history,weight,...x})=>x),warnings,updatedAt:new Date().toISOString()});
}
