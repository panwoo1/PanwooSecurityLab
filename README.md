# Panwoo Security Lab

A personal Next.js + MDX security dashboard for security news, notes, and writeups.

## Structure

- `app/`: Next.js App Router pages and API routes
- `components/`: dashboard UI components
- `content/notes/`: MDX/Markdown notes migrated from the old blog
- `public/files/`: downloadable files such as PDFs
- `public/images/`: static images

## Local development

```bash
npm install
npm run dev
```

Then open `http://127.0.0.1:3000`.

Production build:

```bash
npm run build
npm run start
```
