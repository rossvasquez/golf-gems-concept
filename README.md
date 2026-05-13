# IAWA Map POC

An interactive map-story proof of concept for stepping through location data with a polished, golf-themed UX.

The point of the POC is the interaction model more than the final content: a full-screen Mapbox canvas, a sticky scrollytelling track, direct step navigation patterns, and per-location cards that mount only for the active stop. Each step draws the active course geometry, flies out, then fits the next location cleanly so the experience feels intentional instead of like a static map with markers.

## Tech Stack

- Vite, React, and TypeScript for the static app shell
- Tailwind CSS for styling
- ShadCN UI with the Sera preset for primitives
- Playfair Display and Noto Sans for typography
- Lucide React for icons
- Zustand for story and map state orchestration
- Mapbox GL JS for the map, fly transitions, and GeoJSON rendering

## POC Content

The current story is **Ross Gems**: my top 3 golf courses played.

1. Kiawah Island Ocean Course
2. The Harvester Club
3. Caledonia Golf and Fish Club

Course polygons and properties live in [src/data/dummy-geo.json](/Users/rossv/code/iawa-map-poc/src/data/dummy-geo.json). The file follows the GeoJSON standard and is derived from shapes drafted in [geojson.io](https://geojson.io/next/).

## Setup

Install dependencies:

```sh
npm install
```

Create a local env file:

```sh
cp .env.example .env.local
```

Set the app URL and Mapbox token:

```sh
VITE_APP_URL=https://rossgems.test
VITE_MAPBOX_TOKEN=your_mapbox_public_token
```

Create or manage Mapbox tokens in the [Mapbox console](https://console.mapbox.com/). If the token has URL restrictions, include the value of `VITE_APP_URL` as an allowed origin.

Proxy the local HTTPS hostname to your desired port via Valet:

```sh
valet proxy --secure rossgems.test http://localhost:{desiredPort}
```

Start the dev server:

```sh
npm run dev --port="{desiredPort}"
```

Or pass the port as an environment variable:

```sh
PORT="{desiredPort}" npm run dev
```

Use any open port, but keep the Valet proxy target and Vite port aligned. If no port is provided, `npm run dev` falls back to `5173`.

## Useful Commands

```sh
npm run dev --port="{desiredPort}"
PORT="{desiredPort}" npm run dev
npm run build
npm run lint
npm run preview
```

## Notes

- Restart Vite after changing `.env.local`; Vite reads `VITE_*` variables at server start.
- Keep `VITE_APP_URL` aligned with the Valet hostname so the app can warn when Mapbox token origin restrictions may block tiles.
- Update [src/data/dummy-geo.json](/Users/rossv/code/iawa-map-poc/src/data/dummy-geo.json) with valid GeoJSON `FeatureCollection` data when replacing the sample course content.
- The current implementation is intentionally local/static. Moving beyond the POC likely means adding real course data ingestion, richer step controls, keyboard stepping, and stronger tests around map/store behavior.
