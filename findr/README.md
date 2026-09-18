# Findr

Inclusive, location-based dating / hookup for adults (18+) of every orientation.

**Owner:** Toma Adkins (TomasEmpire)  
**Platform:** **Android-first** (Play Store). Built with **Expo / React Native** so iOS can ship later without a rewrite. No Apple Developer / App Store work is required for this phase.

> This folder lives in the EmpireGold monorepo alongside Play 'n Payday. Findr code is self-contained under `findr/`.

## Layout

```
findr/
  mobile/     Expo (React Native) app — Android-focused scripts
  api/        Fastify + TypeScript API
  db/         Postgres + PostGIS migrations
  docker-compose.yml
```

## Prerequisites

- Node.js 20+
- npm
- Android Studio / emulator **or** Expo Go on a physical Android device
- Docker (optional, for local Postgres + PostGIS)

## Run the API

```bash
cd findr/api
cp .env.example .env
npm install
npm run dev
```

Health check:

```bash
curl http://localhost:4000/health
# {"ok":true,"service":"findr-api","ts":"..."}
```

Stub route prefixes: `/auth`, `/profiles`, `/geo`, `/chat`, `/safety` (mostly `501` until vendors are wired).

## Run the database

```bash
cd findr
docker compose up -d db
docker compose exec -T db psql -U findr -d findr < db/migrations/001_init.sql
```

Connection string: `postgres://findr:findr@localhost:5432/findr`  
See [db/README.md](./db/README.md).

## Run the Android app (Expo)

```bash
cd findr/mobile
npm install
npm run android
```

Useful variants:

| Script | Purpose |
| --- | --- |
| `npm start` | Expo dev server (scan QR / pick platform) |
| `npm run android` | Open on Android emulator / connected device |
| `npm run android:go` | Prefer Expo Go on device |
| `npm run ios` | iOS later (needs macOS / Apple tooling) |
| `npm run web` | Quick UI smoke on web only |

App shell screens: **onboarding (18+)**, **Nearby** grid, **Profile**, **Chats** / thread, **Safety** (block/report stubs).

Point the client at the API with your LAN IP when testing on a physical device (not `localhost`).

## Brand

- Name: **Findr** (`app.findr.mobile`)
- Visual direction: deep ink + warm coral + teal accents; Fraunces + Outfit — original Findr identity, not a competitor lookalike.

## Out of scope (this scaffold)

Production auth vendor wiring, real chat vendor, NSFW scanning, payments, map/stories/video. Clear `TODO` comments mark buy-vs-build seams.

## License / IP

Original Findr naming and UI only. Do not copy competitor trademarks, assets, or trade dress.
