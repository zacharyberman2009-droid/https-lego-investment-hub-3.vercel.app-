# BrickAlpha — Automatic LEGO Market Research

This production build uses the OpenAI Responses API with built-in web search to research current public LEGO pricing automatically from a set number. The server route is `app/api/market-value/route.ts`; the OpenAI key stays server-side in Vercel as `OPENAI_API_KEY` and is never sent to the browser.

The market workflow prioritizes sold/completed evidence, then established price-guide estimates, then active listings and retail references. Every accepted source must include a supporting public URL. If the automatic search cannot verify enough numeric prices, the UI retains direct public-source links as a fallback.

See `UPLOAD_INSTRUCTIONS.txt` for deployment steps.
