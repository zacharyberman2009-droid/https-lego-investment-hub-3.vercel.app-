import {ResearchLink} from "./types";
export function normalizeSetNumber(value:string){const clean=value.trim();return clean.includes("-")?clean:`${clean}-1`}
export function researchLinks(setNumber:string):ResearchLink[]{
  const raw=setNumber.trim(); const no=normalizeSetNumber(raw); const q=encodeURIComponent(`LEGO ${raw}`);
  return [
    {source:"bricklink",label:"BrickLink Price Guide",purpose:"6-month sold averages + current listings",tier:"primary",url:`https://www.bricklink.com/catalogPG.asp?S=${encodeURIComponent(no)}`},
    {source:"brickeconomy",label:"BrickEconomy",purpose:"Current estimated new/used value + growth",tier:"primary",url:`https://www.brickeconomy.com/set/${encodeURIComponent(no)}/`},
    {source:"ebay",label:"eBay Sold",purpose:"Recent completed/sold listings",tier:"primary",url:`https://www.ebay.com/sch/i.html?_nkw=${q}&LH_Sold=1&LH_Complete=1`},
    {source:"pricecharting",label:"PriceCharting",purpose:"Current collectible price guide",tier:"secondary",url:`https://www.pricecharting.com/search-products?type=prices&q=${q}`},
    {source:"brickowl",label:"BrickOwl",purpose:"Current marketplace listings",tier:"secondary",url:`https://www.brickowl.com/search/catalog?query=${encodeURIComponent(raw)}`},
    {source:"brickset",label:"Brickset",purpose:"Catalog, release and retail reference",tier:"secondary",url:`https://brickset.com/sets?query=${encodeURIComponent(raw)}`},
    {source:"stockx",label:"StockX",purpose:"Bid/ask market check when the set is carried",tier:"secondary",url:`https://stockx.com/search?s=${q}`},
    {source:"rebrickable",label:"Rebrickable",purpose:"Catalog identity + retailer comparison",tier:"secondary",url:`https://rebrickable.com/sets/?q=${encodeURIComponent(raw)}`},
    {source:"lego",label:"LEGO.com",purpose:"Official MSRP / current retail availability",tier:"retail",url:`https://www.lego.com/en-us/search?q=${encodeURIComponent(raw)}`},
    {source:"amazon",label:"Amazon",purpose:"Current retail marketplace check",tier:"retail",url:`https://www.amazon.com/s?k=${q}`},
    {source:"mercari",label:"Mercari",purpose:"Current peer-to-peer asking prices",tier:"secondary",url:`https://www.mercari.com/search/?keyword=${q}`},
    {source:"walmart",label:"Walmart",purpose:"Current retail check",tier:"retail",url:`https://www.walmart.com/search?q=${q}`},
    {source:"target",label:"Target",purpose:"Current retail check",tier:"retail",url:`https://www.target.com/s?searchTerm=${q}`}
  ]
}
