import {NextRequest,NextResponse} from "next/server";
import {researchLinks} from "@/lib/research";
export async function GET(req:NextRequest){const setNumber=req.nextUrl.searchParams.get("setNumber")?.trim();if(!setNumber)return NextResponse.json({error:"Missing setNumber"},{status:400});return NextResponse.json({mode:"chatgpt-managed",market:null,sources:[],researchLinks:researchLinks(setNumber),message:"BrickAlpha market values are managed through the Supabase ChatGPT research queue. This endpoint intentionally makes no paid external API calls."})}
