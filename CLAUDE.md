# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Simply Nerdy is a content website for the Simply Nerdy YouTube channel. It has two parts:

1. **Static frontend** — vanilla HTML/CSS/JS served via GitHub Pages (no build step, no framework)
2. **Automation system** — Node.js pipeline that converts YouTube transcript `.txt` files into article JSON using Claude API

## Commands

### Frontend (no build step)
```bash
# Serve locally — pick any static server
python -m http.server 8000
npx serve
```

### Automation (`cd automation/` first)
```bash
npm install              # install deps
npm start                # start file watcher (watches transcripts/incoming/)
npm test                 # dry-run mode — processes without writing files
npm run validate         # validate data/articles.json structure
```

Automation requires `automation/.env` with `ANTHROPIC_API_KEY`. See `automation/.env.example`.

## Architecture

### Data flow
Transcript `.txt` dropped in `transcripts/incoming/` → chokidar file watcher → Claude API transforms to article → appended to `data/articles.json` (with automatic backup) → transcript moved to `transcripts/processed/`. Failures go to `transcripts/failed/` with `.error.txt` logs.

### Frontend data model
All content lives in JSON files under `data/`. The frontend fetches `data/articles.json` at runtime and renders client-side. There is no templating engine or static site generator — `article.html` reads the `?slug=` query parameter and finds the matching post from the JSON.

Articles are displayed newest-first (sorted by date in JS). The `_instructions` key at the top of `articles.json` is metadata for humans/AI, not rendered.

### CSS architecture
Four-file split: `main.css` (design system + CSS variables), `layout.css` (grid), `components.css` (reusable parts), `responsive.css` (breakpoints). All theming goes through CSS custom properties defined in `:root` in `main.css`. Brand color is `--primary: #E60012`.

### JS pattern
All frontend JS uses IIFEs (`(function() { 'use strict'; ... })()`) — no modules, no bundler. Each file is self-contained and loaded via `<script>` tags in HTML pages.

### Automation internals (`automation/src/`)
- `transcript-processor.js` — main orchestrator, file watcher entry point
- `claude-api.js` — Claude API calls with retry/backoff, loads prompt from `templates/article-prompt.txt`
- `articles-manager.js` — reads/writes `data/articles.json`, handles backups
- `image-handler.js` — Unsplash integration (currently disabled in `config/settings.json`)
- `utils.js` — logging (Winston), HTML sanitization, retry helpers

Automation uses ES modules (`"type": "module"` in package.json). Requires Node >= 18.

### Key configuration
- `automation/config/settings.json` — Claude model, categories, retry settings, folder paths
- Categories are fixed: Games, Books, Movies, TV Shows, Music
- Claude model is set to `claude-sonnet-4-6` (configurable in settings.json)

## Article schema

Each article in `data/articles.json` has: `id`, `title`, `slug`, `date` (YYYY-MM-DD), `category`, `excerpt`, `content` (raw HTML), `tags` (array, lowercase-with-hyphens), `author`, `image` (path under `/images/articles/`).

## Deployment

Frontend deploys automatically via GitHub Pages from the `main` branch (root folder). The `CNAME` file configures the custom domain. Automation runs separately (local machine or server).
