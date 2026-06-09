# Astra — Cinematic Space-Travel Landing Page

A single-page landing site for **Astra**, a near-future space-travel brand: two full-height
sections (Hero + Capabilities) of refined liquid-glass UI floating over full-bleed looping
space footage.

Implemented from the Astra Design System handoff bundle (claude.ai/design) —
`ui_kits/landing/standalone.html` — as a dependency-free static site: plain HTML, CSS, and
vanilla JavaScript. No build step, no frameworks.

## Run it

Open `index.html` directly in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# → http://localhost:8000
```

Works as-is on any static host (GitHub Pages, Netlify, etc.).

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | The page — Hero + Capabilities sections |
| `styles/tokens.css` | Design tokens: monochrome white-on-black palette, type, spacing, radii |
| `styles/liquid-glass.css` | The signature `.liquid-glass` / `.liquid-glass-strong` surfaces (masked lit-edge gradient) |
| `styles/main.css` | Layout, components, entrance + BlurText animations |
| `js/main.js` | Starfield backdrops, rAF video crossfade, IntersectionObserver animation triggers |

## Design notes

- **Type:** Instrument Serif (always italic) for display, Barlow for everything functional —
  loaded from Google Fonts.
- **Surfaces:** everything is translucent "liquid glass" with a 1.4px lit edge; no solid fills
  except the highest-priority white pills ("New", "Claim a Spot").
- **Background videos** stream from CloudFront and crossfade at the loop seam with a pure
  `requestAnimationFrame` fade (no CSS transitions, manual looping). Each section paints a
  cinematic starfield (canvas-drawn, seeded so it's identical on every visit) behind the
  footage, so the page never goes black if the video can't load or play. The design kit's
  fallback stills were themselves canvas-generated placeholders; swap in real frames or
  photography when available.
- **Animation:** entrance elements rise in from blur (easeOut, staggered); the headline
  reveals word by word. All entrance animations respect `prefers-reduced-motion`.
