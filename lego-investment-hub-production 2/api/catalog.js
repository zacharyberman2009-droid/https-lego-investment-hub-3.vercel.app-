function normalizeSet(v){const s=String(v||'').trim();return s.includes('-')?s:`${s}-1`}
export default async function handler(req,res){
  try{
    const key=process.env.REBRICKABLE_API_KEY;
    if(!key)return res.status(503).json({error:'Rebrickable is not configured. Add REBRICKABLE_API_KEY in Vercel Environment Variables.'});
    const setNumber=normalizeSet(req.query.set);
    if(!setNumber)return res.status(400).json({error:'Missing set number.'});
    const r=await fetch(`https://rebrickable.com/api/v3/lego/sets/${encodeURIComponent(setNumber)}/`,{headers:{Authorization:`key ${key}`,Accept:'application/json'}});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)return res.status(r.status).json({error:data.detail||'Rebrickable could not find that set.'});
    res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({setNumber:data.set_num||setNumber,name:data.name||'',year:data.year||null,pieces:data.num_parts||null,imageUrl:data.set_img_url||'',themeId:data.theme_id||null,theme:''});
  }catch(e){return res.status(500).json({error:e.message||'Catalog lookup failed.'})}
}
