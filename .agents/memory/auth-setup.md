---
name: Auth Setup
description: NextAuth + PHP JWT auth; how Google/Apple/Phone credentials connect
---

## NextAuth Providers
- GoogleProvider → needs GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
- AppleProvider → needs APPLE_ID + APPLE_SECRET
- CredentialsProvider → phone + password → calls PHP /auth/login or /auth/register

## JWT Flow
- NextAuth issues a session JWT containing: backendToken, role, coinBalance, freeImagesUsed, phone
- backendToken is the PHP-issued JWT (valid 30 days)
- PHP JWT secret: `JWT_SECRET` env var (fallback: 'optilogix-jwt-secret-change-in-prod')

## Session Type Extensions
- `types/next-auth.d.ts` extends Session and JWT types
- Access in components via `useSession()` from next-auth/react

## SessionProvider
- `components/SessionProviderWrapper.tsx` wraps children with `<SessionProvider>`
- Imported in `app/layout.tsx` (root layout)

**Why:** OAuth callbacks must go through Next.js (not PHP) because they need HTTP redirects. PHP handles business logic after the OAuth identity is established.

## User Roles
- `client` (default), `admin`, `god`
- Role is stored in PHP SQLite users table; synced into JWT
