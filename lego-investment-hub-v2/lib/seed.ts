import { LegoItem } from "./types";

const today = new Date().toISOString();
const ago = (days:number) => new Date(Date.now()-days*86400000).toISOString().slice(0,10);

export const seedInventory: LegoItem[] = [
  {id:"75342",setNumber:"75342",name:"Republic Fighter Tank",theme:"Star Wars",condition:"New/Sealed",quantity:28,cost:45,market:59,storePrice:65,status:"For Sale",location:"Star Wars A",lastUpdated:today,history:[{date:ago(90),market:49},{date:ago(30),market:55},{date:ago(7),market:58},{date:ago(0),market:59}]},
  {id:"75331",setNumber:"75331",name:"The Razor Crest (UCS)",theme:"Star Wars",condition:"New/Sealed",quantity:1,cost:700,market:765,storePrice:800,status:"For Sale",location:"UCS Display",lastUpdated:today,history:[{date:ago(90),market:720},{date:ago(30),market:748},{date:ago(7),market:758},{date:ago(0),market:765}]},
  {id:"75314",setNumber:"75314",name:"The Bad Batch Attack Shuttle",theme:"Star Wars",condition:"New/Sealed",quantity:1,cost:200,market:244,storePrice:250,status:"For Sale",location:"Star Wars B",lastUpdated:today,history:[{date:ago(90),market:205},{date:ago(30),market:228},{date:ago(7),market:239},{date:ago(0),market:244}]},
  {id:"75280",setNumber:"75280",name:"501st Legion Clone Troopers",theme:"Star Wars",condition:"New/Sealed",quantity:6,cost:45,market:52,storePrice:55,status:"For Sale",location:"Battle Packs",lastUpdated:today,history:[{date:ago(90),market:43},{date:ago(30),market:49},{date:ago(7),market:51},{date:ago(0),market:52}]},
  {id:"10303",setNumber:"10303",name:"Loop Coaster",theme:"Icons",condition:"New/Sealed",quantity:1,cost:300,market:352,storePrice:379,status:"Hold",location:"Back Stock",lastUpdated:today,history:[{date:ago(90),market:330},{date:ago(30),market:345},{date:ago(7),market:349},{date:ago(0),market:352}]}
];
