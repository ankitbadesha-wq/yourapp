# Story Video Builder

A simple wizard-style web app to create **original, child-friendly educational YouTube videos** using research from existing videos — transformed into new original story-based output.

Not a copy/reupload tool: the flow pushes toward original script, original narration, transformed structure, replacement visuals, and an originality review before export.

## Flow (8 steps)
1. **Search** — research tools: keyword/URL/channel search + filters (live YouTube Data API or samples)
2. **Shortlist** — compare & score sources, tag use (facts / narration / visuals / hook)
3. **Story Build** — cluster facts, pick tone/learning style, generate a kid-safe story outline
4. **Script & Narration** — original script with pause/emphasis markers + duration estimate
5. **Scene Builder** — storyboard with replacement visuals + originality flags
6. **Production Tools** — edit brief, metadata, export package for an editor
7. **Publish Center** — originality check, kid-content checklist, upload prep
8. **Video Tracker** — log performance to guide the next video

## Tech
Pure static: `index.html` + `style.css` + `app.js`. No build, no dependencies. State auto-saves to `localStorage`.

## Run locally
Open `index.html` in a browser, or serve the folder with any static server. Add a YouTube Data API v3 key in Step 1 for live search (stored locally only).

## Placeholders (labeled in-app, not faked)
- **TTS narration** — export the script and use your own TTS/voiceover tool.
- **YouTube upload** — architecture is official YouTube Data API v3 `videos.insert` via Google OAuth 2.0 (`youtube.upload` scope) through a small backend. Not implemented in the MVP.

## Deploy (GitHub Pages)
Pushing to `main` runs `.github/workflows/deploy.yml` and publishes automatically. In repo **Settings → Pages**, set **Source: GitHub Actions**.
