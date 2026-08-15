# BrickAlpha — Supabase Final

This is the clean Supabase-backed BrickAlpha build.

- Inventory/watchlist live in Supabase instead of browser-only localStorage.
- Existing localStorage inventory is automatically imported once if Supabase is empty.
- Price refresh requests are stored in Supabase.
- ChatGPT can read the connected Supabase project, research queued LEGO sets, and write prices/sources back.
- No OpenAI API key, BrickLink seller API key, BrickEconomy paid API key, or eBay API key is required by the website.
- The website no longer performs paid/fragile price scraping itself.

## One required Supabase setting
Enable Anonymous Sign-Ins in Supabase: Authentication → Providers → Anonymous Sign-Ins → Enable.

Then deploy this folder as the Vercel Root Directory.
