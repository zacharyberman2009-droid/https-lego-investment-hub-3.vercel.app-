export type Condition = "New/Sealed" | "Used Complete" | "Used Incomplete";
export type InventoryStatus = "For Sale" | "Hold" | "Personal" | "Consignment";

export type PriceSnapshot = {
  date: string;
  market: number;
};

export type MarketSource = {
  source: string;
  label: string;
  value: number;
  kind: "sold" | "estimate" | "listing";
  detail?: string;
};

export type LegoItem = {
  id: string;
  setNumber: string;
  name: string;
  theme: string;
  year?: number;
  condition: Condition;
  quantity: number;
  cost: number;
  market: number;
  storePrice: number;
  status: InventoryStatus;
  location?: string;
  imageUrl?: string;
  notes?: string;
  lastUpdated?: string;
  marketSources?: MarketSource[];
  history: PriceSnapshot[];
};

export type WatchItem = {
  id: string;
  setNumber: string;
  name: string;
  targetBuyPrice: number;
  currentMarket: number;
  notes?: string;
};
