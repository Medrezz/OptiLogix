---
name: OptiLogix Platform Architecture
description: Full SaaS AI workspace stack, ports, data stores, and page routing
---

## Stack
- **Frontend**: Next.js 15 + React 19, port 5000, App Router
- **Backend**: PHP 8.2, port 8000, `backend/` dir, SQLite DB at `backend/optilogix.db`
- **AI**: Moonshot Kimi K2 for chat/vision (MOONSHOT_API_KEY secret), DALL-E 3 for images
- **Database**: MongoDB (MONGODB_URI secret) for chat history/images; SQLite (PHP) for users/coins/transactions/API keys

## Workflows
- `Start application` → `npm run dev` → port 5000, webview
- `PHP Backend` → `php -S 0.0.0.0:8000 -t backend/` → port 8000, console

## Page Routes
- `/` → Splash screen (auto-redirects to /home after 3.5s)
- `/home` → Landing page (hero, features, vs ChatGPT/Gemini comparison, pricing)
- `/auth` → Sign in/up (Google, Apple, Phone+Password)
- `/workspace` → AI workspace (chat free, image gate)
- `/dashboard` → Client dashboard (coins, buy, history)
- `/dashboard/developer` → API key management + docs
- `/admin` → Admin dashboard (stats, user management, transactions)
- `/admin/god` → God Admin dashboard (full revenue, promote users)

## PHP Backend Endpoints
- POST /auth/register, /auth/login, /auth/oauth, GET /auth/me
- GET /coins/balance, /coins/packages, /coins/history; POST /coins/deduct, /coins/purchase, /coins/confirm
- GET /admin/stats, /admin/users, /admin/transactions, /admin/god-overview, /admin/god-admins; POST /admin/user
- GET /keys/list; POST /keys/create, /keys/revoke, /keys/verify

## Environment Variables (.env.local)
- NEXTAUTH_SECRET, NEXTAUTH_URL
- NEXT_PUBLIC_BACKEND_URL=http://localhost:8000, BACKEND_URL=http://localhost:8000
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (user must provide)
- APPLE_ID, APPLE_SECRET (user must provide)

**Why:** PHP handles business logic (coins, users, API keys) via JWT. NextAuth handles OAuth flow. SessionProvider wraps root layout.
