# BrickAlpha — One Big Fix

This is a clean Next.js replacement build for the LEGO investment dashboard.

## What changed

- Removed the BrickLink seller OAuth requirement from the normal market workflow.
- `/api/market-value` always returns public research links for valid set numbers instead of failing with 503 when API keys are absent.
- Public market research includes BrickLink Price Guide, BrickEconomy, eBay Sold, PriceCharting, BrickOwl, Brickset, StockX, Rebrickable, Mercari, LEGO, Amazon, Walmart, and Target.
- Inventory market values can be blended from the visible public values entered by the user.
- Existing inventory, dashboard, market history, news, and watchlist pages remain included.

## Vercel

Recommended Root Directory: `brickalpha-one-big-fix`

No BrickLink, BrickEconomy, or PriceCharting environment variables are required for the core public-research workflow.
