# BrickAlpha — LEGO Inventory & Investment Intelligence

A working MVP for managing LEGO inventory, tracking cost basis/store prices, storing market-price history, calculating 7/30/90-day trends, maintaining a watchlist, and aggregating LEGO market news.

## What works immediately

- Dashboard with portfolio value, cost basis, unrealized gain and retail value
- Inventory add/delete/search
- Separate New/Sealed, Used Complete and Used Incomplete conditions
- Quantity, cost, market value, store price, status and shelf location
- Local browser persistence (no database account required for the demo)
- Price-history snapshots and 7/30/90-day percent-change calculations
- Watchlist / target buy prices
- LEGO investment news feed using Google News RSS fallback
- Server routes ready for Rebrickable catalog lookup and BrickLink sold-price data

## Run locally

Requirements: Node.js 20.9+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## Enable automatic LEGO catalog lookup

Create a Rebrickable API key and set:

```env
REBRICKABLE_API_KEY=...
```

Then use **Auto fill** while adding an inventory item.

## Enable BrickLink sold-price refresh

Create BrickLink API credentials and populate:

```env
BRICKLINK_CONSUMER_KEY=...
BRICKLINK_CONSUMER_SECRET=...
BRICKLINK_TOKEN=...
BRICKLINK_TOKEN_SECRET=...
```

The inventory **↻ Price** button calls BrickLink's six-month sold price guide, separated by new/used condition, then stores the result as a dated market snapshot.

## Production upgrade recommended

The current MVP deliberately uses localStorage so it works immediately. For a real store deployment, move inventory, snapshots, watchlists and news into Supabase/PostgreSQL. Add authentication and a scheduled daily job (Vercel Cron, Supabase Cron, or another scheduler) to refresh all market values once per day. Keep BrickLink secrets server-side.

Suggested tables:

- `inventory_items`
- `price_snapshots`
- `watchlist`
- `news_items`
- `consignors`
- `sales`

## Important pricing design

Market value and store price are intentionally separate. Automated market refreshes should never silently overwrite the price you physically charge customers.


## Version 2 market pricing

The inventory now has an **Edit** button and a **Find current price** action. Your cost and store price remain manually controlled. Market value is calculated separately.

The live market-value endpoint can blend:

- BrickLink last-6-month sold price (highest weight)
- BrickEconomy current new/used value (when a BrickEconomy API key is configured)
- BrickLink current listings (lower weight because asking prices are less reliable than sold prices)

In Vercel, open **Project > Settings > Environment Variables** and add any API credentials you have from `.env.example`, then redeploy. BrickEconomy is optional; its API availability/rate limits depend on your BrickEconomy account.

No secret API key should ever be committed to GitHub. Keep them in Vercel Environment Variables only.
