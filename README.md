# Noxalith Main Bot

Discord bot for the Noxalith community, built with TypeScript and Seyfert.

Features: levels, profiles, reputation, activity roles and giveaways.

## Setup

Requires Node.js 24, MongoDB with replica set support, and Chromium for profile cards.

```bash
npm ci
npx playwright install chromium
cp .env.example .env
```

Fill in `.env`, then build and start the bot:

```bash
npm run build
npm start
```

For the development server, use `npm run dev`.

_Made with ❤️ by Quarnel_
