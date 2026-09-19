# Apply to MyRunner (not EmpireGold)

This folder is a **drop-in apply package** for https://github.com/Toma-Shops-2025/MyRunner.

The Cursor agent that built this could only push to EmpireGold (`cursor[bot]` has no write access on MyRunner). Do **not** merge these paths into the Play 'n Payday / EmpireGold app. Copy them into the MyRunner repo instead.

## Quick apply

From a clean MyRunner checkout on `main`:

```bash
# Option A — patch
git apply --index path/to/myrunner-babylovegrowth.patch
# or: git am / patch manually

# Option B — copy files from this folder over the MyRunner root
# (preserves relative paths: .github/, scripts/, src/, public/, .env.example, package.json)
rsync -a --exclude myrunner-babylovegrowth.patch --exclude README.md ./ /path/to/MyRunner/
```

Then commit on a MyRunner branch and open a PR there.

## After apply

1. Set `BABYLOVEGROWTH_API_KEY` (local `.env` + GitHub Actions secret). See Project store setup doc.
2. Run `npm run sync:babylovegrowth` once.
3. Confirm `/blog` on the site.
4. Confirm workflow **BabyLoveGrowth article sync** is enabled (daily cron).

## What this adds

| Path | Purpose |
|------|---------|
| `scripts/sync-babylovegrowth.mjs` | Paginated API sync → local JSON |
| `src/content/babylovegrowth/` | Article storage (served locally; never live API on page view) |
| `src/routes/blog.tsx`, `blog.$slug.tsx` | Blog UI + SEO/JSON-LD |
| `.github/workflows/babylovegrowth-sync.yml` | Daily scheduled sync |
| Nav / sitemap / robots updates | Discoverability |

No API keys are included. `.env.example` only has an empty `BABYLOVEGROWTH_API_KEY=` placeholder.
