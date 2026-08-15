# BrickAlpha — LEGO Investment Hub

This is the corrected production Next.js project for the existing Vercel site.

## What changed

- A new **Price Research** page searches one LEGO set number across multiple market sources.
- Public research links are generated for BrickLink Price Guide, BrickEconomy, eBay Sold, PriceCharting, BrickOwl, StockX, Rebrickable, LEGO.com, Amazon, Walmart, and Target.
- The site no longer fails when BrickLink seller API credentials are missing.
- Official API data is used automatically when you choose to configure supported credentials.
- Public values can always be entered manually and blended into a market estimate.
- Missing sources are automatically reweighted instead of breaking the calculation.
- Inventory keeps market evidence separate from your cost and your store price.
- Existing local inventory is migrated from the prior `lih_inventory_v1` browser-storage key.

## Important limitation

BrickLink and BrickEconomy publish useful prices on public webpages, but their terms restrict automated scraping/robots. This build does **not** bypass those restrictions. Instead it opens the exact public page/search for the set and lets you enter the visible number. If you later obtain official API access, the same site automatically incorporates the API response.

## Replace the existing GitHub project

Your Vercel Root Directory should remain:

`lego-investment-hub-v2`

In GitHub, open the existing `lego-investment-hub-v2` folder and replace its contents with the contents of this folder. Do **not** upload this folder as another nested directory.

The final GitHub structure should look like:

```
lego-investment-hub-v2/
  app/
  components/
  lib/
  package.json
  tsconfig.json
  next-env.d.ts
  .env.example
  README.md
```

Vercel should use:

- Framework Preset: Next.js
- Root Directory: `lego-investment-hub-v2`
- Build Command: default
- Install Command: default
- Output Directory: default

## Optional Vercel environment variables

None are required for the public-price workflow.

`REBRICKABLE_API_KEY` — set metadata autofill.

`BRICKECONOMY_API_KEY` — BrickEconomy official API current values.

`PRICECHARTING_TOKEN` — PriceCharting official current-price API.

`BRICKLINK_CONSUMER_KEY`, `BRICKLINK_CONSUMER_SECRET`, `BRICKLINK_TOKEN`, `BRICKLINK_TOKEN_SECRET` — BrickLink official Store API if you become eligible later.

After adding or changing environment variables, redeploy the production deployment.

## Market weighting

Automatic and entered evidence is weighted by evidence quality rather than simply averaged. Completed/sold evidence receives the strongest weight, established guide/model values are next, and active listings receive lower weight. The source breakdown is always shown so the estimate can be audited.
