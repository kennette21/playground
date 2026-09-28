# Garage Inventory

A small web app that knows what is in every drawer, bin and shelf in the garage, prints QR labels for them, and answers "where are my pliers?" by voice or text on a wall tablet.

## What it does (phase 1)

- **Locations tree**: areas → containers (tool chests) → drawers / bins / shelves. Every location gets a short code (`TC1-D03`) and a QR code that opens that location.
- **Items** with quantity, unit, category, tags, notes, optional photo, and a full **history** (added, moved, quantity changed, "still here" checks).
- **Find** page: fuzzy text search plus **voice search** (Web Speech API, works in Chrome/Edge/Safari). "Show me" highlights the drawer on the **Map**.
- **Scan** page: camera QR scanner (native `BarcodeDetector`, falls back to ZXing) or type a code.
- **Map**: schematic of the garage built from the location tree. Drawers stack, bins tile, and the searched location glows.
- **Export**:
  - `Labels .xlsx` / `.csv` – one row per location (`Code`, `Line1`, `Line2`, `Contents`, `QR`, …) for Brother P-touch Editor, DYMO Connect, NIIMBOT, Phomemo or ZebraDesigner. All cells are stored as text; the `QR` column is a URL.
  - `Inventory .xlsx` – items + locations for Excel / Sheets.
  - `Print label sheet` – browser print view sized to your tape (e.g. 50×25 mm); print straight to the label printer driver or save as PDF.
  - JSON backup / restore.
- **Kiosk mode** (`#/?kiosk=1`) hides navigation and reads results aloud, for a tablet on the wall. Installable as a home-screen app.

## Run it

```bash
cd garage-inventory
npm install
npm run dev        # http://localhost:5173
```

Open **Settings → Load sample garage** to see it with data. With no configuration the data lives in the browser's `localStorage` (one device). Hash routing (`/#/l/TC1-D03`) means the built app is plain static files: `npm run build` and drop `dist/` on any host (GitHub Pages, a Raspberry Pi with nginx, Netlify, …).

## Sync across devices with Supabase (optional)

1. Create a Supabase project and run `supabase/migrations/0001_init.sql` in the SQL editor (or `supabase db push`).
2. Enable **Email** auth (magic link) in Authentication → Providers.
3. In the app, **Settings → Storage backend**: paste the project URL and anon key, click Connect, then send yourself a magic link. Or set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `.env` before building.
4. Move existing data over with **Export → Backup .json** then **Restore** while connected.

The schema (`locations`, `items`, `item_events`) mirrors `src/types.ts`; row-level security grants any signed-in user of the project full access, which is right for a single household.

## Printing labels

Set **Settings → Base URL** to the address the tablet/phone will actually open (for example `http://garage.local` or your Supabase-hosted URL) *before* exporting, since it is baked into each QR. See `docs/RESEARCH.md` for per-printer import notes (Brother, DYMO, NIIMBOT, Phomemo, Zebra).

## Phase 2: photo → inventory

The plan and model survey for pointing a camera at a drawer and having the items list generated automatically is in `docs/RESEARCH.md`. Short version: a cloud vision model (Gemini Flash or Claude) with a JSON schema gives good item names for under a cent per photo; counts of loose fasteners stay approximate and need a one-tap correction UI.

## Layout

```
src/types.ts          data model
src/store.ts          in-memory store + write-through persistence, history events
src/repo/             LocalRepo (localStorage) and SupabaseRepo
src/lib/              codes, search (Fuse), speech, QR, Excel/CSV export, sample data
src/pages/            Find, Scan, Locations, Location, Item, Map, Export, Labels, Settings
supabase/migrations/  Postgres schema
```
