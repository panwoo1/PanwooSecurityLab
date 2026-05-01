# Panwoo Security Lab

A personal security dashboard and Jekyll note archive for CTF workflow, security news, and writeups.

## Structure

- `_layouts/`: page, post, archive, and home templates
- `_includes/`: shared UI blocks (header, post list)
- `_pages/`: static pages and archive entry points
- `_posts/`: markdown posts
- `assets/css/main.css`: custom design system and responsive layout
- `proxy/dreamhack-proxy.mjs`: local/hosted DreamHack reverse proxy
- `scripts/fetch_security_news.py`: RSS fetcher for dashboard news

## Local development

```bash
bundle install
bundle exec jekyll serve
```

Then open `http://127.0.0.1:4000`.

## DreamHack proxy

GitHub Pages is static hosting, so it cannot run the Node proxy process. Run the proxy locally or deploy it to a Node runtime such as Replit, Render, Fly.io, or a small VPS.

Local run:

```bash
npm install
npm run proxy:dreamhack
```

Open:

```text
http://127.0.0.1:5000
```

Override the DreamHack target when the challenge port changes:

```bash
DH_HOST=host3.dreamhack.games DH_PORT=13784 npm run proxy:dreamhack
```

For a hosted setup, deploy this repo as a Node app and use:

```bash
npm run proxy:dreamhack
```

Then paste the hosted URL into the dashboard's hosted proxy field.
