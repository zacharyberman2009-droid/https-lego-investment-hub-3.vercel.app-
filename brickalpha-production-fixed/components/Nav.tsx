"use client";
import Link from "next/link";import {usePathname} from "next/navigation";
const links=[["/","Dashboard"],["/inventory","Inventory"],["/research","Price Research"],["/market","Market"],["/watchlist","Watchlist"],["/news","News"]];
export default function Nav(){const p=usePathname();return <aside className="sidebar"><div className="brand"><div className="brick">●</div><div><b>BrickAlpha</b><small>LEGO intelligence</small></div></div><nav>{links.map(([href,label])=><Link key={href} className={p===href?"active":""} href={href}>{label}</Link>)}</nav><div className="side-note"><b>Market data</b><span>Official APIs when configured. Public marketplace research is always available.</span></div></aside>}
