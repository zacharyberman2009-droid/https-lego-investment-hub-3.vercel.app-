import {NextRequest,NextResponse} from "next/server";
import OpenAI from "openai";
import {normalizeSetNumber,researchLinks} from "@/lib/research";

type Kind="sold"|"estimate"|"listing"|"retail";
type FoundSource={source:string;label:string;value:number;kind:Kind;detail:string;url:string;confidence:"high"|"medium"|"low"};

const weights:Record<Kind,number>={sold:50,estimate:28,listing:12,retail:5};

function cleanSources(input:unknown):FoundSource[]{
  if(!Array.isArray(input)) return [];
  const seen=new Set<string>();
  const out:FoundSource[]=[];
  for(const raw of input){
    if(!raw||typeof raw!=="object") continue;
    const r=raw as Record<string,unknown>;
    const value=Number(r.value);
    const url=typeof r.url==="string"?r.url:"";
    const label=typeof r.label==="string"?r.label.trim():"";
    const source=typeof r.source==="string"?r.source.trim():label.toLowerCase().replace(/[^a-z0-9]+/g,"_");
    const kind=(r.kind==="sold"||r.kind==="estimate"||r.kind==="listing"||r.kind==="retail")?r.kind:"estimate";
    if(!Number.isFinite(value)||value<=0||value>100000||!label||!url.startsWith("http")) continue;
    const key=`${source}|${url}|${value}`;
    if(seen.has(key)) continue;
    seen.add(key);
    out.push({source,label,value,kind,detail:typeof r.detail==="string"?r.detail:"Public web price",url,confidence:r.confidence==="high"||r.confidence==="low"?r.confidence:"medium"});
  }
  return out.slice(0,12);
}

function blend(sources:FoundSource[]){
  if(!sources.length)return{market:null,low:null,high:null};
  const adjusted=sources.map(s=>({...s,w:weights[s.kind]*(s.confidence==="high"?1:s.confidence==="medium"?.75:.45)}));
  const total=adjusted.reduce((a,s)=>a+s.w,0);
  const market=adjusted.reduce((a,s)=>a+s.value*s.w,0)/Math.max(total,1);
  const values=sources.map(s=>s.value).sort((a,b)=>a-b);
  return{market:Number(market.toFixed(2)),low:Number(values[0].toFixed(2)),high:Number(values[values.length-1].toFixed(2))};
}

export async function GET(req:NextRequest){
  const raw=req.nextUrl.searchParams.get("setNumber")?.trim();
  const condition=req.nextUrl.searchParams.get("condition")==="U"?"U":"N";
  if(!raw)return NextResponse.json({error:"Missing setNumber"},{status:400});
  const setNumber=normalizeSetNumber(raw);
  const fallback=researchLinks(raw);

  if(!process.env.OPENAI_API_KEY){
    return NextResponse.json({
      error:"OPENAI_API_KEY is missing in this Vercel deployment. Add it to Production environment variables, then redeploy.",
      code:"OPENAI_KEY_MISSING",
      researchLinks:fallback
    },{status:500});
  }

  try{
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const conditionText=condition==="N"?"new/sealed":"used complete";
    const response=await client.responses.create({
      model:process.env.OPENAI_MARKET_MODEL||"gpt-5",
      tools:[{type:"web_search",search_context_size:"high",user_location:{type:"approximate",country:"US",region:"Illinois",city:"Highland Park",timezone:"America/Chicago"}}],
      input:`Research the current USD market value of LEGO set ${setNumber}, condition ${conditionText}. This is price research, not shopping advice. Search the public web broadly, prioritizing recent and set-specific evidence from BrickLink price-guide/search results, BrickEconomy, eBay sold/completed results or indexed sold evidence, PriceCharting, BrickOwl, Brickset, Rebrickable, StockX, and other reputable LEGO resale/price-guide sources.\n\nRules:\n- Only report a numeric value when the web result/page explicitly supports that price for LEGO set ${setNumber}.\n- Never invent a price. If a source cannot be read or does not expose a reliable numeric value, omit it.\n- Distinguish sold/completed evidence from estimates and active listings.\n- Do not use MSRP/retail as resale market evidence unless clearly labeled retail.\n- Prefer recent prices and USD. Convert only when the page itself gives USD or the result clearly states USD.\n- For sold data, use a representative recent average/typical value, not a single obvious outlier.\n- Every source object must include the actual URL supporting the value.\n- Return at most 12 source values.`,
      text:{format:{
        type:"json_schema",
        name:"lego_market_research",
        strict:true,
        schema:{
          type:"object",
          additionalProperties:false,
          properties:{
            setName:{type:"string"},
            summary:{type:"string"},
            sources:{type:"array",items:{type:"object",additionalProperties:false,properties:{
              source:{type:"string"},label:{type:"string"},value:{type:"number"},kind:{type:"string",enum:["sold","estimate","listing","retail"]},detail:{type:"string"},url:{type:"string"},confidence:{type:"string",enum:["high","medium","low"]}
            },required:["source","label","value","kind","detail","url","confidence"]}}
          },required:["setName","summary","sources"]
        }
      }}
    });

    let parsed:{setName?:string;summary?:string;sources?:unknown}={};
    try{parsed=JSON.parse(response.output_text||"{}")}catch{}
    const sources=cleanSources(parsed.sources);
    const valuation=blend(sources);

    return NextResponse.json({
      setNumber,
      setName:parsed.setName||"",
      condition,
      ...valuation,
      sources,
      researchLinks:fallback,
      mode:"openai-web-search",
      summary:parsed.summary||"",
      methodology:"Automatic public-web research. Sold/completed evidence is weighted highest, then established estimates, active listings, and retail references. Lower-confidence evidence receives less weight.",
      updatedAt:new Date().toISOString()
    });
  }catch(error){
    const message=error instanceof Error?error.message:"Automatic web research failed";
    console.error("market-value lookup failed",error);
    return NextResponse.json({error:message,code:"OPENAI_MARKET_LOOKUP_FAILED",researchLinks:fallback},{status:502});
  }
}
