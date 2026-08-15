import {NextRequest,NextResponse} from "next/server";
import {normalizeSetNumber,researchLinks} from "@/lib/research";

/**
 * Public market research endpoint.
 *
 * Important: this endpoint intentionally does NOT scrape BrickLink,
 * BrickEconomy, eBay, or other marketplaces and does not require private
 * seller/API credentials. It always returns HTTP 200 for a valid set number
 * plus exact public research links for the set.
 */
export async function GET(req:NextRequest){
  const setNumber=req.nextUrl.searchParams.get("setNumber")?.trim();
  const condition=req.nextUrl.searchParams.get("condition")==="U"?"U":"N";

  if(!setNumber){
    return NextResponse.json({error:"Missing setNumber"},{status:400});
  }

  return NextResponse.json({
    setNumber:normalizeSetNumber(setNumber),
    condition,
    market:null,
    low:null,
    high:null,
    sources:[],
    researchLinks:researchLinks(setNumber),
    mode:"public-research",
    message:"Open the public market pages and enter the visible values in BrickAlpha. No BrickLink seller account or API keys are required.",
    methodology:"BrickAlpha blends the public prices you enter, emphasizing completed/sold evidence over estimates and active listings.",
    updatedAt:new Date().toISOString()
  });
}
