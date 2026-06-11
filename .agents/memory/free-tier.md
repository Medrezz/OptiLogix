---
name: Free Tier Logic
description: What's free, what requires login, and how image coins work
---

## Rules
- **Text chat (Brain mode)**: Unlimited, no login required
- **Vision (image upload/OCR)**: Allowed without login (just chat)
- **Image generation (Canvas mode)**: Requires login; 3 free images, then 50 coins each

## Coin Rates
- Image: 50 coins
- Chat: 1 coin per 1,000 tokens
- 1 coin = 2,000 tokens

## Coin Packages
- Starter: 500 coins = 5 SAR ≈ $1.33 USD
- Pro: 1,500 coins = 15 SAR ≈ $4.00 USD
- Elite: 5,000 coins = 40 SAR ≈ $10.67 USD

## Gate Implementation
- `ChatInterface.tsx`: `canGenerateImage()` checks session + freeImagesLeft + coinBalance
- If no session → shows AuthGate banner with "Sign In" button
- If session but no free images and insufficient coins → shows buy coins prompt
- PHP `/coins/deduct` endpoint handles actual deduction (checks free_images_used column)

**Why:** Chat free keeps acquisition cost low. Image gate drives monetization without paywall friction.
