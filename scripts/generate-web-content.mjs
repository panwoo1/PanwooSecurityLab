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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

function safeUrl(value) {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed
  }
  return ''
}

function renderInline(raw) {
  let text = escapeHtml(raw)
  const code = []

  text = text.replace(/`([^`]+)`/g, (_, value) => {
    const token = `@@CODE${code.length}@@`
    code.push(`<code>${value}</code>`)
    return token
  })

  text = text.replace(/!\[([^\]]*)]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, alt, url) => {
    const href = safeUrl(url)
    if (!href) return escapeHtml(alt)
    return `<img src="${escapeAttribute(href)}" alt="${escapeAttribute(alt)}" loading="lazy" />`
  })

  text = text.replace(/\[([^\]]+)]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, url) => {
    const href = safeUrl(url)
    if (!href) return label
    return `<a href="${escapeAttribute(href)}" target="_blank" rel="noreferrer">${label}</a>`
  })

  text = text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')

  code.forEach((value, index) => {
    text = text.replace(`@@CODE${index}@@`, value)
  })

  return text
}

function flushParagraph(lines, output) {
  if (!lines.length) return
  output.push(`<p>${renderInline(lines.join(' '))}</p>`)
  lines.length = 0
}

function flushList(items, output) {
  if (!items.length) return
  output.push(`<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`)
  items.length = 0
}

function cleanMarkdown(content) {
  return content
    .replaceAll('{% raw %}', '')
    .replaceAll('{% endraw %}', '')
    .replace(/\{:\s*[^}]+\}/g, '')
}

function renderMarkdown(content) {
  const lines = cleanMarkdown(content).split(/\r?\n/)
  const output = []
  const paragraph = []
  const list = []
  let inCode = false
  let codeLanguage = ''
  let codeLines = []

  for (const line of lines) {
    const fence = line.match(/^```([A-Za-z0-9_-]*)\s*$/)
    if (fence) {
      if (inCode) {
        output.push(
          `<pre><code${codeLanguage ? ` class="language-${escapeAttribute(codeLanguage)}"` : ''}>${escapeHtml(codeLines.join('\n'))}</code></pre>`
        )
        inCode = false
        codeLanguage = ''
        codeLines = []
      } else {
        flushParagraph(paragraph, output)
        flushList(list, output)
        inCode = true
        codeLanguage = fence[1] || ''
      }
      continue
    }

    if (inCode) {
      codeLines.push(line)
      continue
    }

    if (!line.trim()) {
      flushParagraph(paragraph, output)
      flushList(list, output)
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      flushParagraph(paragraph, output)
      flushList(list, output)
      const level = heading[1].length + 1
      output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`)
      continue
    }

    const listItem = line.match(/^\s*[-*]\s+(.+)$/)
    if (listItem) {
      flushParagraph(paragraph, output)
      list.push(listItem[1])
      continue
    }

    const quote = line.match(/^>\s*(.+)$/)
    if (quote) {
      flushParagraph(paragraph, output)
      flushList(list, output)
      output.push(`<blockquote>${renderInline(quote[1])}</blockquote>`)
      continue
    }

    if (/^---+$/.test(line.trim())) {
      flushParagraph(paragraph, output)
      flushList(list, output)
      output.push('<hr />')
      continue
    }

    flushList(list, output)
    paragraph.push(line.trim())
  }

  if (inCode) {
    output.push(
      `<pre><code${codeLanguage ? ` class="language-${escapeAttribute(codeLanguage)}"` : ''}>${escapeHtml(codeLines.join('\n'))}</code></pre>`
    )
  }
  flushParagraph(paragraph, output)
  flushList(list, output)

  return output.join('\n')
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
      content,
      html: renderMarkdown(content)
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
  html: string
}

export const generatedAt = ${JSON.stringify(newsPayload.generated_at)}
export const newsItems: NewsItem[] = ${JSON.stringify(newsPayload.items, null, 2)}
export const blogPosts: BlogPost[] = ${JSON.stringify(notes, null, 2)}
`

fs.writeFileSync(outputPath, generated)
console.log(`Generated ${path.relative(root, outputPath)} with ${newsPayload.items.length} news items and ${notes.length} posts.`)
