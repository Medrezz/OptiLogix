# OptiLogix

A premium, standalone, multimodal AI workspace platform combining elite motion-heavy interface design with Moonshot AI intelligence.

## Features
- **The Omniscient Brain** — General Q&A via Moonshot AI (Kimi K2)
- **The Vision Scanner** — Image upload and analysis with OCR
- **The Creative Canvas** — AI image generation via DALL-E 3 (tool calling)
- **Animated Aura Background** — Reactive animated glow that changes with AI state
- **Glassmorphism UI** — Frosted glass panels, premium dark theme
- **PWA ready** — Installable on any device

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + custom animations
- **AI**: Moonshot AI API (chat + vision) + OpenAI DALL-E 3 (images)
- **Database**: MongoDB (conversation history, generated images)

## Environment Variables Required
- `MOONSHOT_API_KEY` — Moonshot AI API key (from platform.moonshot.cn)
- `OPENAI_API_KEY` — OpenAI API key for DALL-E 3 image generation
- `MONGODB_URI` — MongoDB connection string (optional, for persistence)

## Running
```bash
npm run dev
```
Runs on port 5000 at 0.0.0.0.

## User Preferences
- Dark, premium aesthetic with glassmorphism
- Reactive animated background (aura)
