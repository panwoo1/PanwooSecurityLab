import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { blogPosts, generatedAt, newsItems, type BlogPost, type NewsItem } from './generated-content'
import './styles.css'

type Tab = 'news' | 'blog'

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

function normalized(value: string) {
  return value.toLowerCase().trim()
}

function matchesNews(item: NewsItem, query: string) {
  const haystack = `${item.title} ${item.summary} ${item.source} ${item.region} ${item.published}`
  return normalized(haystack).includes(query)
}

function matchesPost(post: BlogPost, query: string) {
  const haystack = `${post.title} ${post.excerpt} ${post.date} ${post.categories.join(' ')} ${post.tags.join(' ')}`
  return normalized(haystack).includes(query)
}

function NewsList({ items }: { items: NewsItem[] }) {
  if (!items.length) {
    return <p className="empty">검색 결과가 없습니다.</p>
  }

  return (
    <div className="item-list">
      {items.map((item) => (
        <article className="entry" key={item.slug}>
          <div className="entry-meta">
            <span>{item.source}</span>
            <span>{item.region === 'domestic' ? '국내' : '글로벌'}</span>
            <span>{formatDate(item.published)}</span>
          </div>
          <h2>{item.title}</h2>
          <p>{item.summary}</p>
          <div className="entry-actions">
            <a href={item.url} target="_blank" rel="noreferrer">
              원문 열기
            </a>
            {item.translateUrl ? (
              <a href={item.translateUrl} target="_blank" rel="noreferrer">
                번역 보기
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}

function BlogReader({ posts }: { posts: BlogPost[] }) {
  const [selectedSlug, setSelectedSlug] = useState(posts[0]?.slug ?? '')
  const selected = posts.find((post) => post.slug === selectedSlug) ?? posts[0]

  if (!posts.length || !selected) {
    return <p className="empty">게시글이 없습니다.</p>
  }

  return (
    <div className="reader">
      <aside className="post-list" aria-label="Blog posts">
        {posts.map((post) => (
          <button
            className={post.slug === selected.slug ? 'post-button active' : 'post-button'}
            key={post.slug}
            onClick={() => setSelectedSlug(post.slug)}
            type="button"
          >
            <span>{post.title}</span>
            <small>{post.date || 'No date'}</small>
          </button>
        ))}
      </aside>

      <article className="post-view">
        <div className="entry-meta">
          <span>{selected.date || 'No date'}</span>
          {selected.categories.slice(0, 3).map((category) => (
            <span key={category}>{category}</span>
          ))}
        </div>
        <h2>{selected.title}</h2>
        {selected.tags.length ? (
          <div className="tag-row">
            {selected.tags.slice(0, 8).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
        <div className="markdown-body" dangerouslySetInnerHTML={{ __html: selected.html }} />
      </article>
    </div>
  )
}

function App() {
  const [tab, setTab] = useState<Tab>('news')
  const [query, setQuery] = useState('')
  const search = normalized(query)

  const filteredNews = useMemo(() => {
    const sorted = [...newsItems].sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())
    return search ? sorted.filter((item) => matchesNews(item, search)) : sorted
  }, [search])

  const filteredPosts = useMemo(() => {
    return search ? blogPosts.filter((post) => matchesPost(post, search)) : blogPosts
  }, [search])

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">Panwoo Security Lab</p>
          <h1>Security news and research notes</h1>
        </div>
        <nav className="tabs" aria-label="Primary">
          <button className={tab === 'news' ? 'active' : ''} onClick={() => setTab('news')} type="button">
            News
          </button>
          <button className={tab === 'blog' ? 'active' : ''} onClick={() => setTab('blog')} type="button">
            Blog
          </button>
        </nav>
      </header>

      <section className="toolbar" aria-label="Search and status">
        <input
          aria-label="Search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tab === 'news' ? '뉴스 검색' : '블로그 검색'}
          type="search"
          value={query}
        />
        <p>
          {tab === 'news'
            ? `${filteredNews.length} / ${newsItems.length} news`
            : `${filteredPosts.length} / ${blogPosts.length} posts`}
        </p>
      </section>

      {tab === 'news' ? (
        <>
          <section className="summary-band">
            <p>Generated at {formatDate(generatedAt)}</p>
            <p>국내외 보안 뉴스를 한 화면에서 검색하고 원문으로 이동합니다.</p>
          </section>
          <NewsList items={filteredNews} />
        </>
      ) : (
        <BlogReader posts={filteredPosts} />
      )}
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
