import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '..')
const newsPath = path.join(root, 'assets', 'data', 'security-news.json')
const notesDir = path.join(root, 'content', 'notes')
const outputPath = path.join(root, 'apps', 'web', 'src', 'generated-content.ts')

function parseFrontmatter(raw) {
  if (!raw.startsWith('---\n')) return [{}, raw]

  const end = raw.indexOf('\n---', 4)
  if (end === -1) return [{}, raw]

  const frontmatter = raw.slice(4, end).trim()
  const content = raw.slice(end + 4).trim()
  const data = {}
  let currentKey = ''

  for (const line of frontmatter.split('\n')) {
    const listItem = line.match(/^\s*-\s+(.+)$/)
    if (listItem && currentKey) {
      data[currentKey] = [...(Array.isArray(data[currentKey]) ? data[currentKey] : []), listItem[1].trim()]
      continue
    }

    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!pair) continue

    currentKey = pair[1]
    const value = pair[2].trim()
    if (!value) {
      data[currentKey] = []
    } else if (value.startsWith('[') && value.endsWith(']')) {
      data[currentKey] = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    } else {
      data[currentKey] = value.replace(/^['"]|['"]$/g, '')
    }
  }

  return [data, content]
}

function asList(value) {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string' && value.trim()) return [value]
  return []
}

function slugFromFile(file) {
  return file.replace(/\.(md|mdx)$/, '')
}

function dateFromSlug(slug) {
  return slug.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? ''
}

function excerpt(content) {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/[#>*_`[\](){}:|=-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)
}

const newsPayload = JSON.parse(fs.readFileSync(newsPath, 'utf8'))
const notes = fs
  .readdirSync(notesDir)
  .filter((file) => /\.(md|mdx)$/.test(file))
  .map((file) => {
    const slug = slugFromFile(file)
    const raw = fs.readFileSync(path.join(notesDir, file), 'utf8')
    const [data, content] = parseFrontmatter(raw)
    const date = data.date ? String(data.date).slice(0, 10) : dateFromSlug(slug)

    return {
      slug,
      title: String(data.title || slug),
      date,
      categories: asList(data.categories),
      tags: asList(data.tags),
      excerpt: excerpt(content),
      content
    }
  })
  .sort((a, b) => b.date.localeCompare(a.date))

const generated = `export type NewsItem = {
  source: string
  region: 'domestic' | 'global'
  slug: string
  title: string
  url: string
  translateUrl: string
  published: string
  summary: string
}

export type BlogPost = {
  slug: string
  title: string
  date: string
  categories: string[]
  tags: string[]
  excerpt: string
  content: string
}

export const generatedAt = ${JSON.stringify(newsPayload.generated_at)}
export const newsItems: NewsItem[] = ${JSON.stringify(newsPayload.items, null, 2)}
export const blogPosts: BlogPost[] = ${JSON.stringify(notes, null, 2)}
`

fs.writeFileSync(outputPath, generated)
console.log(`Generated ${path.relative(root, outputPath)} with ${newsPayload.items.length} news items and ${notes.length} posts.`)
