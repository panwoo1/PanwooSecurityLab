import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import type { BlogPost, NewsItem } from './generated-content'
import { AppShell } from './components/layout/AppShell'
import type { AppSection, BlogPostSummary, ContentState } from './types'
import { AgentsPage } from './pages/Agents'
import { AutomationPage } from './pages/Automation'
import { BlogPage } from './pages/Blog'
import { ExamPage, type ExamCandidate, type ExamQuestion } from './pages/Exam'
import { HomePage } from './pages/Home'
import { LogsPage } from './pages/Logs'
import { NewsPage } from './pages/News'
import { WalletPage } from './pages/Wallet'
import './styles.css'

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
  const haystack = `${item.title} ${item.summary} ${item.articleText ?? ''} ${item.source} ${item.region} ${item.published}`
  return normalized(haystack).includes(query)
}

function matchesPost(post: BlogPostSummary, query: string) {
  const haystack = `${post.title} ${post.excerpt} ${post.date} ${post.categories.join(' ')} ${post.tags.join(' ')}`
  return normalized(haystack).includes(query)
}

const examKeywords = [
  '암호',
  '암호화',
  '인증',
  '접근통제',
  '권한',
  '취약점',
  'cve',
  '보안 업데이트',
  '패치',
  '악성코드',
  '랜섬웨어',
  '피싱',
  '스미싱',
  '침해사고',
  '사고 대응',
  '보안관제',
  'siem',
  '로그',
  '네트워크',
  '방화벽',
  'vpn',
  'dns',
  'ddos',
  '시스템',
  'linux',
  'kernel',
  '클라우드',
  '공급망',
  'sbom',
  '개인정보',
  '개인정보보호',
  '정보보호',
  'isms',
  '위험관리',
  '보안정책',
  'kisa'
]

const examTopics = [
  {
    topic: '침해사고 대응',
    keywords: ['침해사고', '사고 대응', '보안관제', 'siem', '로그', '악성코드', '랜섬웨어', '피싱', '스미싱'],
    stem: '다음 상황에서 보안관제 담당자가 가장 먼저 수행해야 할 대응으로 적절한 것은?',
    answer: '관련 로그와 이벤트를 확인해 영향 범위를 식별하고 필요한 격리·차단 조치를 진행한다.',
    distractors: [
      '원인 분석 전에 모든 로그를 삭제해 추가 유출을 방지한다.',
      '피해 범위 확인 없이 전체 보안정책을 즉시 완화한다.',
      '외부 공지부터 진행하고 내부 증거 보존은 생략한다.'
    ],
    explanation: '공격 징후가 있는 경우에는 증거 보존, 로그 분석, 영향 범위 확인, 격리와 차단 순서가 중요합니다.'
  },
  {
    topic: '네트워크 보안',
    keywords: ['네트워크', '방화벽', 'vpn', 'dns', 'ddos'],
    stem: '다음 상황을 네트워크 보안 관점에서 볼 때 우선 점검할 항목으로 적절한 것은?',
    answer: '접근 경로, 방화벽·VPN 정책, DNS 및 트래픽 이상 징후를 함께 확인한다.',
    distractors: [
      '네트워크 통제는 애플리케이션 보안과 무관하므로 확인하지 않는다.',
      '외부 연결을 모두 허용한 뒤 사용자 불편 여부만 확인한다.',
      '트래픽 패턴보다 화면 UI 변경 이력을 우선 조사한다.'
    ],
    explanation: '네트워크 보안 문제는 접근 경로와 통제 정책, 트래픽 흐름을 같이 확인해야 합니다.'
  },
  {
    topic: '시스템 보안',
    keywords: ['취약점', 'cve', '보안 업데이트', '패치', '시스템', 'linux', 'kernel'],
    stem: '다음 취약점 또는 보안 업데이트 이슈에 대한 관리 조치로 가장 적절한 것은?',
    answer: '영향 받는 자산을 식별하고 패치 적용 가능성, 우회 조치, 재부팅 필요 여부를 검토한다.',
    distractors: [
      '운영 중인 시스템은 패치를 적용하지 않는 것이 원칙이다.',
      '취약점 공지는 개발 환경에만 적용하고 운영 자산은 제외한다.',
      '패치 전후 검증 없이 모든 서비스를 동시에 중단한다.'
    ],
    explanation: '시스템 보안에서는 자산 식별, 취약점 영향도 판단, 패치와 우회 조치 검증이 핵심입니다.'
  },
  {
    topic: '정보보호 관리',
    keywords: ['정보보호', 'isms', '위험관리', '보안정책', '공급망', 'sbom', '클라우드'],
    stem: '다음 이슈를 정보보호 관리체계 관점에서 처리할 때 가장 적절한 접근은?',
    answer: '위험을 식별·평가하고 정책, 책임, 공급망 또는 클라우드 통제 현황을 점검한다.',
    distractors: [
      '관리체계 이슈는 기술 조치와 관련이 없으므로 문서화하지 않는다.',
      '외부 공급망 위험은 계약 관계와 무관하므로 평가 대상에서 제외한다.',
      '정책 예외는 승인 절차 없이 담당자가 임의로 결정한다.'
    ],
    explanation: '정보보호 관리는 위험평가, 정책, 책임, 외부 의존성 통제를 함께 다룹니다.'
  },
  {
    topic: '암호 및 인증',
    keywords: ['암호', '암호화', '인증', '접근통제', '권한'],
    stem: '다음 상황과 관련해 인증·접근통제 관점에서 올바른 설명은?',
    answer: '사용자 또는 시스템의 신원을 확인하고 필요한 권한만 부여하는 통제가 필요하다.',
    distractors: [
      '인증이 완료되면 모든 권한을 자동으로 부여하는 것이 안전하다.',
      '암호화는 무결성이나 인증과는 어떤 관련도 없다.',
      '접근통제는 내부 사용자에게는 적용하지 않는다.'
    ],
    explanation: '암호와 인증 영역은 기밀성, 무결성, 인증, 최소권한 원칙을 함께 이해해야 합니다.'
  },
  {
    topic: '개인정보보호',
    keywords: ['개인정보', '개인정보보호', 'kisa'],
    stem: '다음 상황과 관련해 개인정보보호 관점에서 가장 적절한 조치는?',
    answer: '처리 목적과 보유 범위를 확인하고 접근권한, 암호화, 파기 등 보호조치를 점검한다.',
    distractors: [
      '개인정보는 업무 편의를 위해 목적 제한 없이 계속 보관한다.',
      '접근권한 관리는 시스템 관리자에게만 적용하고 일반 사용자는 제외한다.',
      '개인정보 유출 가능성이 있어도 정보주체 통지와 신고 검토는 필요 없다.'
    ],
    explanation: '개인정보보호는 목적 제한, 최소 처리, 접근통제, 암호화, 파기와 사고 대응 의무를 포함합니다.'
  }
]

function buildChoices(answer: string, distractors: string[], seed: string) {
  const choices = [answer, ...distractors]
  const offset = seed.charCodeAt(0) % choices.length
  return [...choices.slice(offset), ...choices.slice(0, offset)]
}

function articleBasis(item: NewsItem) {
  return item.articleText || item.summary || item.title
}

function splitSentences(value: string) {
  const sentences: string[] = []
  let current = ''

  for (const char of value) {
    current += char
    if ('.!?。！？다'.includes(char)) {
      const sentence = current.trim()
      if (sentence) sentences.push(sentence)
      current = ''
    }
  }

  const rest = current.trim()
  if (rest) sentences.push(rest)
  return sentences
}

function contextFromArticle(item: NewsItem, keywords: string[]) {
  const fallback = item.summary || item.title
  const sentences = splitSentences(articleBasis(item))
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 24)
  const keywordSentence = sentences.find((sentence) => keywords.some((keyword) => normalized(sentence).includes(normalized(keyword))))
  const context = keywordSentence || sentences[0] || fallback
  return context.length > 260 ? `${context.slice(0, 257)}...` : context
}

function createExamQuestion(item: NewsItem, keywords: string[]): ExamQuestion {
  const matchedTopic =
    examTopics.find(({ keywords: topicKeywords }) => topicKeywords.some((keyword) => keywords.includes(keyword))) ?? examTopics[2]

  return {
    topic: matchedTopic.topic,
    stem: matchedTopic.stem,
    context: contextFromArticle(item, keywords),
    choices: buildChoices(matchedTopic.answer, matchedTopic.distractors, item.slug),
    answer: matchedTopic.answer,
    explanation: `${keywords.slice(0, 3).join(', ')} 키워드가 기사 내용에서 확인되므로 ${matchedTopic.explanation}`
  }
}

function scoreExamCandidate(item: NewsItem): ExamCandidate | null {
  const title = normalized(item.title)
  const summary = normalized(item.summary)
  const articleText = normalized(item.articleText ?? '')
  const source = normalized(item.source)
  const keywords = examKeywords.filter((keyword) => {
    const term = normalized(keyword)
    return title.includes(term) || summary.includes(term) || articleText.includes(term) || source.includes(term)
  })

  if (!keywords.length) return null

  const score = keywords.reduce((total, keyword) => {
    const term = normalized(keyword)
    if (title.includes(term)) return total + 3
    if (articleText.includes(term)) return total + 2
    if (source.includes(term)) return total + 2
    return total + 1
  }, 0)

  return { item, score, keywords, question: createExamQuestion(item, keywords) }
}

function matchesExamCandidate(candidate: ExamCandidate, query: string) {
  return (
    matchesNews(candidate.item, query) ||
    normalized(candidate.keywords.join(' ')).includes(query) ||
    normalized(`${candidate.question.topic} ${candidate.question.stem} ${candidate.question.answer}`).includes(query)
  )
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Request failed: ${response.status}`)
  return (await response.json()) as T
}

async function loadDevelopmentFallback(): Promise<ContentState | null> {
  if (!import.meta.env.DEV) return null

  const generated = await import('./generated-content')
  return {
    generatedAt: generated.generatedAt,
    newsItems: generated.newsItems,
    blogPosts: generated.blogPosts.map(({ content: _content, html: _html, ...post }) => post),
    selectedPost: generated.blogPosts[0] ?? null,
    status: 'ready'
  }
}

function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('overview')
  const [newsQuery, setNewsQuery] = useState('')
  const [examQuery, setExamQuery] = useState('')
  const [blogQuery, setBlogQuery] = useState('')
  const [content, setContent] = useState<ContentState>({
    generatedAt: '',
    newsItems: [],
    blogPosts: [],
    selectedPost: null,
    status: 'loading'
  })
  const newsSearch = normalized(newsQuery)
  const examSearch = normalized(examQuery)
  const blogSearch = normalized(blogQuery)

  const loadPost = React.useCallback(async (slug: string) => {
    try {
      const detail = await fetchJson<{ generatedAt: string; post: BlogPost }>(`/api/posts/${encodeURIComponent(slug)}`)
      setContent((current) => ({ ...current, selectedPost: detail.post }))
    } catch {
      const fallback = await loadDevelopmentFallback()
      const generated = import.meta.env.DEV ? await import('./generated-content') : null
      const post = generated?.blogPosts.find((item) => item.slug === slug) ?? fallback?.selectedPost ?? null
      setContent((current) => ({ ...current, selectedPost: post }))
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadContent() {
      try {
        const [news, posts] = await Promise.all([
          fetchJson<{ generatedAt: string; items: NewsItem[] }>('/api/news'),
          fetchJson<{ generatedAt: string; items: BlogPostSummary[] }>('/api/posts')
        ])
        const firstSlug = posts.items[0]?.slug
        const firstPost = firstSlug ? await fetchJson<{ generatedAt: string; post: BlogPost }>(`/api/posts/${encodeURIComponent(firstSlug)}`) : null

        if (!cancelled) {
          setContent({
            generatedAt: news.generatedAt || posts.generatedAt,
            newsItems: news.items,
            blogPosts: posts.items,
            selectedPost: firstPost?.post ?? null,
            status: 'ready'
          })
        }
      } catch {
        const fallback = await loadDevelopmentFallback()
        if (!cancelled && fallback) {
          setContent(fallback)
          return
        }
        if (!cancelled) {
          setContent((current) => ({ ...current, status: 'error' }))
        }
      }
    }

    loadContent()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredNews = useMemo(() => {
    const sorted = [...content.newsItems].sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())
    return newsSearch ? sorted.filter((item) => matchesNews(item, newsSearch)) : sorted
  }, [content.newsItems, newsSearch])

  const examCandidates = useMemo(() => {
    const candidates = content.newsItems
      .map(scoreExamCandidate)
      .filter((candidate): candidate is ExamCandidate => Boolean(candidate))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return new Date(b.item.published).getTime() - new Date(a.item.published).getTime()
      })

    return examSearch ? candidates.filter((candidate) => matchesExamCandidate(candidate, examSearch)) : candidates
  }, [content.newsItems, examSearch])

  const filteredPosts = useMemo(() => {
    return blogSearch ? content.blogPosts.filter((post) => matchesPost(post, blogSearch)) : content.blogPosts
  }, [content.blogPosts, blogSearch])

  function renderSection() {
    if (content.status === 'error') {
      return <p className="my-7 text-slate-400">콘텐츠 API를 불러오지 못했습니다.</p>
    }

    if (content.status === 'loading') {
      return <p className="my-7 text-slate-400">콘텐츠를 불러오는 중입니다.</p>
    }

    if (activeSection === 'news') {
      return (
        <NewsPage
          items={filteredNews}
          query={newsQuery}
          totalCount={content.newsItems.length}
          generatedAt={content.generatedAt}
          onQueryChange={setNewsQuery}
          formatDate={formatDate}
        />
      )
    }

    if (activeSection === 'blog') {
      return (
        <BlogPage
          posts={filteredPosts}
          selectedPost={content.selectedPost}
          query={blogQuery}
          totalCount={content.blogPosts.length}
          generatedAt={content.generatedAt}
          onQueryChange={setBlogQuery}
          onSelect={loadPost}
          formatDate={formatDate}
        />
      )
    }

    if (activeSection === 'exam') {
      return (
        <ExamPage
          candidates={examCandidates}
          query={examQuery}
          totalCount={content.newsItems.length}
          generatedAt={content.generatedAt}
          onQueryChange={setExamQuery}
          formatDate={formatDate}
        />
      )
    }

    if (activeSection === 'agents') return <AgentsPage />
    if (activeSection === 'automation') return <AutomationPage />
    if (activeSection === 'wallet') return <WalletPage />
    if (activeSection === 'logs') return <LogsPage />

    return (
      <HomePage
        newsCount={content.newsItems.length}
        postsCount={content.blogPosts.length}
        generatedAt={formatDate(content.generatedAt)}
        onSectionChange={setActiveSection}
      />
    )
  }

  return (
    <AppShell activeSection={activeSection} generatedAt={formatDate(content.generatedAt)} onSectionChange={setActiveSection}>
      {renderSection()}
    </AppShell>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
