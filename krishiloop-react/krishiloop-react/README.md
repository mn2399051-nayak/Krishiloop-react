# KrishiLoop — Residue to value

A responsive, role-aware web prototype for coordinating agricultural residue from farm listing through matching, collection, processor intake, and impact reporting. The initial fictional pilot focuses on paddy residue in Punjab.

## Run locally

Requirements: Node.js 18 or later.

```bash
pnpm install
pnpm dev
```

Alternatively, run `npm install`, `npm run dev`. Use the local URL printed by Vite.

To make a production build:

```bash
pnpm build
pnpm preview
```

## Publish a public shareable website

This is a static Vite site and can be hosted on Vercel, Netlify, or Cloudflare Pages. Deployment needs to be connected to an account you control; this workspace does not currently contain a hosting account or repository connection.

Recommended settings for any of those providers:

- Build command: `pnpm build` (or `npm run build`)
- Output directory: `dist`
- Node version: 18 or later

For Vercel, import the project folder/repository and accept the Vite defaults. For Netlify and Cloudflare Pages, use the settings above. The included `vercel.json` and `netlify.toml` provide SPA fallback routing. After the first deploy, the provider gives you a public HTTPS URL that remains available while the deployment and hosting account are active.

Important: user accounts and application records currently live only in each visitor's browser storage. A public deployment makes the website reachable, but does not make records shared between visitors or add real authentication. A backend and database are needed for a shared operational service.

## Demo access

Choose a role on the sign-in screen (Farmer, Collector, Processor, Buyer, or Admin). Any valid email and a password of four or more characters will enter the demo. A suggested demo email and password are prefilled for convenience.

The demo supports:

- Farmer residue listings with type, location, estimated tonnes, dates, indicative price, and quality.
- Marketplace listings and processor demand board.
- Explainable, weighted processor match scores based on compatibility, distance, quantity, timing, capacity, and quality.
- Collection jobs, suggested pickup order, and recording actual collected quantity.
- Processor intake records and lot lifecycle tracking.
- Operational dashboard metrics, CSV export, and a local-only activity report.
- Light/dark appearance and responsive layouts.

## Data and limitations

The six seeded farms/lots and processor requirements are illustrative project data. New listings, pickup jobs, demand requirements, and intake records are saved in this browser's `localStorage` under `krishiloop-project-data-v1`; they are not sent to a server and may be cleared with browser storage. Demo sign-in selects a role and does not authenticate a real identity. Access rules are designed to guide demo navigation, not to secure data against a real threat model.

The matching and route views use transparent heuristics. Distance and route ordering are approximate, not live navigation. Price fields and processor requirements are examples, not market quotations. Environmental impacts and carbon benefits are not calculated or claimed.

This is a working frontend prototype, not a production full-stack deployment. It has no remote API, database, identity provider, live map tiles, messaging service, payments, or verified operating participants. The app is structured so those services can be added after local workflow and pilot requirements are validated.

## Project structure

```text
src/
  App.jsx             Role flows, local persistence, screens, and actions
  data.js             Illustrative pilot data and matching weights
  index.css           Responsive application styling
  components/         Original dashboard components (retained for reference)
```
