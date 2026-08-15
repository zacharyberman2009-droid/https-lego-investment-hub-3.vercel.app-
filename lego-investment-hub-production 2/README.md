# LEGO Investment Hub v4

Deployment-safe static Vercel app. There is no npm install and no build command.

## Deploy to the existing Vercel project
Replace the repository contents with these files, commit to the production branch, and Vercel will redeploy the existing domain.

Framework preset: **Other** (or leave auto-detected)
Build command: **leave empty**
Output directory: **leave empty**
Install command: **leave empty**

## Environment variables
In Vercel: Project → Settings → Environment Variables. Add the variables from `.env.example`.

Recommended first:
- REBRICKABLE_API_KEY
- BRICKLINK_CONSUMER_KEY
- BRICKLINK_CONSUMER_SECRET
- BRICKLINK_TOKEN_VALUE
- BRICKLINK_TOKEN_SECRET

Optional:
- BRICKECONOMY_API_KEY
- EBAY_CLIENT_ID
- EBAY_CLIENT_SECRET
- EBAY_MARKETPLACE_ID

After adding/changing environment variables, redeploy the latest production deployment.

## Pricing model
- BrickLink last-6-month sold guide: 60%
- BrickEconomy current valuation: 25%
- BrickLink active listing guide: 10%
- eBay active fixed-price listings: 5%

Unavailable sources automatically drop out and remaining weights renormalize. Strong outliers are ignored when at least three sources are available.

## Data storage
Inventory/watchlist data is stored in browser localStorage on the domain. Market-price refreshes add dated snapshots for trend calculations.
