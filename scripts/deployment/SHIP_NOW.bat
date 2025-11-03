@echo off
REM BEE-SHIP Complete Deployment (Windows-compatible version)

echo.
echo ================================================================
echo         BEE-SHIP COMPLETE DEPLOYMENT (Windows Compatible)
echo ================================================================
echo.

REM Create directories
echo [1/5] Creating directories...
if not exist lib\platforms mkdir lib\platforms
if not exist netlify\functions mkdir netlify\functions
if not exist app\api\crypto-intel mkdir app\api\crypto-intel
if not exist app\api\checkout mkdir app\api\checkout
if not exist scripts mkdir scripts
if not exist data mkdir data
echo     Done!

REM Create platform modules
echo.
echo [2/5] Creating platform modules...
call create-platforms-simple.bat

REM Create crypto intel API
echo.
echo [3/5] Creating crypto intel API...
(
echo import { NextResponse } from "next/server";
echo.
echo const API = "https://api.coingecko.com/api/v3/simple/price";
echo.
echo export async function GET^(^) {
echo   try {
echo     const prices = await fetch^(
echo       `${API}?ids=bitcoin,ethereum,solana^&vs_currencies=usd^&include_24hr_change=true`
echo     ^).then^(r =^> r.json^(^)^);
echo     return NextResponse.json^({ timestamp: new Date^(^).toISOString^(^), prices }^);
echo   } catch ^(err: any^) {
echo     return NextResponse.json^({ error: err.message }, { status: 500 }^);
echo   }
echo }
) > app\api\crypto-intel\route.ts
echo     Created crypto-intel API

REM Create checkout API
echo.
echo [4/5] Creating payment routes...
(
echo import Stripe from "stripe";
echo import { NextResponse } from "next/server";
echo.
echo const stripe = new Stripe^(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" }^);
echo.
echo export async function POST^(req: Request^) {
echo   const { plan = "monthly" } = await req.json^(^);
echo   const base = process.env.NEXT_PUBLIC_SITE_URL ^|^| "http://localhost:3000";
echo   const session = await stripe.checkout.sessions.create^({
echo     mode: "subscription",
echo     line_items: [{ price: process.env.STRIPE_PRICE_MONTHLY!, quantity: 1 }],
echo     success_url: `${base}/thanks?session_id={CHECKOUT_SESSION_ID}`,
echo     cancel_url: `${base}/pricing`,
echo   }^);
echo   return NextResponse.json^({ url: session.url }^);
echo }
) > app\api\checkout\route.ts
echo     Created checkout API

REM Install dependencies
echo.
echo [5/5] Installing dependencies...
call npm install stripe @supabase/supabase-js @netlify/functions googleapis nodemailer 2>nul
echo     Done!

echo.
echo ================================================================
echo                     DEPLOYMENT COMPLETE!
echo ================================================================
echo.
echo Files created:
echo   - lib/platforms/instagram.ts
echo   - lib/platforms/tiktok.ts
echo   - lib/platforms/youtube.ts
echo   - netlify/functions/bee-ship.ts
echo   - app/api/crypto-intel/route.ts
echo   - app/api/checkout/route.ts
echo.
echo NEXT STEPS:
echo.
echo 1. Set environment variables in Netlify:
echo    - SUPABASE_URL
echo    - SUPABASE_SERVICE_ROLE_KEY
echo    - BEE_API_URL
echo    - BEE_API_KEY
echo    - INSTAGRAM_ACCOUNT_ID
echo    - FB_ACCESS_TOKEN
echo    - STRIPE_SECRET_KEY
echo    - STRIPE_PRICE_MONTHLY
echo.
echo 2. Commit and push:
echo    git add -A
echo    git commit -m "feat(bee-ship): complete deployment package"
echo    git push
echo.
echo 3. Your Netlify site will auto-deploy!
echo.
echo The swarm is ready to fly! 🐝
echo.
pause
