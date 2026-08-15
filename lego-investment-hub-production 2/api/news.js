function decode(s=''){return s.replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')}
function tag(xml,name){const m=xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`,'i'));return m?decode(m[1].trim()):''}
function host(link){try{return new URL(link).hostname.replace(/^www\./,'')}catch{return 'News'}}
export default async function handler(req,res){
  try{
    const queries=['LEGO investing retirement sets','LEGO resale market retired sets','LEGO collector market prices'];
    const all=[];
    for(const q of queries){
      const u=`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
      const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0 LEGO-Investment-Hub/4.0'}});if(!r.ok)continue;const xml=await r.text();
      const items=xml.match(/<item>[\s\S]*?<\/item>/gi)||[];
      for(const item of items.slice(0,14)){const title=tag(item,'title'),link=tag(item,'link'),date=tag(item,'pubDate'),source=tag(item,'source')||host(link);if(title&&link)all.push({title,link,date:date?new Date(date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'',source})}
    }
    const seen=new Set(),items=all.filter(x=>{const k=x.title.toLowerCase();if(seen.has(k))return false;seen.add(k);return true}).slice(0,24);
    res.setHeader('Cache-Control','s-maxage=1800, stale-while-revalidate=3600');return res.status(200).json({items,updatedAt:new Date().toISOString()});
  }catch(e){return res.status(500).json({error:e.message||'News search failed.'})}
}
