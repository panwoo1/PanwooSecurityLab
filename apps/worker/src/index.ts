import { blogPosts, generatedAt, newsItems, type BlogPost } from './generated-content'

export interface Env {
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
  DASHBOARD_API_BASE_URL?: string
  DASHBOARD_API_TOKEN?: string
  ASSETS?: Fetcher
}

const DEFAULT_MESSAGE = 'Hello from Cloudflare Worker'
const CONTENT_CACHE = 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400'
const STATIC_CACHE = 'public, max-age=300'
const NO_STORE = 'no-store'

const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
}

function cacheForAsset(pathname: string, response: Response): string {
  if (pathname.startsWith('/assets/')) {
    return 'public, max-age=31536000, immutable'
  }

  const contentType = response.headers.get('Content-Type') ?? ''
  if (contentType.includes('text/html')) {
    return 'no-cache'
  }

  return STATIC_CACHE
}

function isSupabaseProjectUrl(url: URL): boolean {
  return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co')
}

function getSupabaseStatus(env: Env) {
  let validUrl = false

  if (env.SUPABASE_URL) {
    try {
      validUrl = isSupabaseProjectUrl(new URL(env.SUPABASE_URL))
    } catch {
      validUrl = false
    }
  }

  return {
    urlConfigured: Boolean(env.SUPABASE_URL),
    anonKeyConfigured: Boolean(env.SUPABASE_ANON_KEY),
    validUrl
  }
}

async function checkSupabaseRead(env: Env) {
  const started = Date.now()

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return { status: 'not-configured', latencyMs: 0 }
  }

  try {
    const baseUrl = new URL(env.SUPABASE_URL)
    if (!isSupabaseProjectUrl(baseUrl)) {
      return { status: 'invalid-url', latencyMs: 0 }
    }

    const endpoint = new URL('/rest/v1/app_messages', baseUrl)
    endpoint.searchParams.set('select', 'value')
    endpoint.searchParams.set('key', 'eq.home')
    endpoint.searchParams.set('limit', '1')

    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(3000),
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        Accept: 'application/json'
      }
    })

    return {
      status: response.ok ? 'ok' : 'error',
      httpStatus: response.status,
      latencyMs: Date.now() - started
    }
  } catch {
    return { status: 'error', latencyMs: Date.now() - started }
  }
}

async function getMessageFromSupabase(env: Env): Promise<string> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return DEFAULT_MESSAGE
  }

  try {
    const baseUrl = new URL(env.SUPABASE_URL)
    if (!isSupabaseProjectUrl(baseUrl)) {
      return DEFAULT_MESSAGE
    }

    const endpoint = new URL('/rest/v1/app_messages', baseUrl)
    endpoint.searchParams.set('select', 'value')
    endpoint.searchParams.set('key', 'eq.home')
    endpoint.searchParams.set('limit', '1')

    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(3000),
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      return DEFAULT_MESSAGE
    }

    const rows = (await response.json()) as Array<{ value?: string }>
    return rows[0]?.value ?? DEFAULT_MESSAGE
  } catch {
    return DEFAULT_MESSAGE
  }
}

function withSecurityHeaders(response: Response, cacheControl?: string): Response {
  const secured = new Response(response.body, response)

  Object.entries(SECURITY_HEADERS).forEach(([name, value]) => {
    secured.headers.set(name, value)
  })

  if (cacheControl) {
    secured.headers.set('Cache-Control', cacheControl)
  }

  return secured
}

function json(data: unknown, cacheControl: string, init?: ResponseInit): Response {
  return withSecurityHeaders(Response.json(data, init), cacheControl)
}

async function proxyDashboardApi(request: Request, env: Env, pathPrefix = '/api'): Promise<Response> {
  const incomingUrl = new URL(request.url)

  if (!env.DASHBOARD_API_BASE_URL) {
    return json({ error: 'DASHBOARD_API_BASE_URL is not configured' }, NO_STORE, { status: 500 })
  }

  if (!env.DASHBOARD_API_TOKEN) {
    return json({ error: 'DASHBOARD_API_TOKEN is not configured' }, NO_STORE, { status: 500 })
  }

  let baseUrl: URL
  try {
    baseUrl = new URL(env.DASHBOARD_API_BASE_URL)
  } catch {
    return json({ error: 'DASHBOARD_API_BASE_URL is invalid' }, NO_STORE, { status: 500 })
  }

  if (baseUrl.protocol !== 'https:') {
    return json({ error: 'DASHBOARD_API_BASE_URL must be an HTTPS URL' }, NO_STORE, { status: 500 })
  }

  if (baseUrl.hostname === incomingUrl.hostname) {
    return json({ error: 'DASHBOARD_API_BASE_URL cannot point to this Worker hostname' }, NO_STORE, { status: 500 })
  }

  const targetPath = incomingUrl.pathname.slice(pathPrefix.length) || '/'
  const targetUrl = new URL(`${targetPath}${incomingUrl.search}`, baseUrl)
  const headers = new Headers(request.headers)

  headers.set('Authorization', `Bearer ${env.DASHBOARD_API_TOKEN}`)
  headers.set('Accept', 'application/json')
  headers.delete('Cookie')
  headers.delete('Host')

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual'
  })

  return withSecurityHeaders(response, NO_STORE)
}

function postSummary(post: BlogPost) {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    categories: post.categories,
    tags: post.tags,
    excerpt: post.excerpt
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname === '/api/health') {
      const supabase = getSupabaseStatus(env)
      const read = await checkSupabaseRead(env)

      return json({
        ok: true,
        service: 'worker',
        version: generatedAt,
        generatedAt,
        database: supabase.urlConfigured && supabase.anonKeyConfigured ? 'supabase' : 'not-configured',
        content: {
          news: newsItems.length,
          posts: blogPosts.length
        },
        supabase: {
          ...supabase,
          read
        }
      }, NO_STORE)
    }

    if (pathname === '/api/message') {
      const message = await getMessageFromSupabase(env)
      return json({ message }, NO_STORE)
    }

    if (pathname === '/api/harness/health') {
      return proxyDashboardApi(request, env, '/api/harness')
    }

    if (
      pathname === '/api/agents' ||
      pathname === '/api/jobs' ||
      pathname.startsWith('/api/jobs/') ||
      pathname === '/api/events' ||
      pathname === '/api/control'
    ) {
      return proxyDashboardApi(request, env)
    }

    if (pathname === '/api/news') {
      return json({ generatedAt, items: newsItems }, CONTENT_CACHE)
    }

    if (pathname === '/api/posts') {
      return json({ generatedAt, items: blogPosts.map(postSummary) }, CONTENT_CACHE)
    }

    if (pathname.startsWith('/api/posts/')) {
      let slug = ''
      try {
        slug = decodeURIComponent(pathname.slice('/api/posts/'.length))
      } catch {
        return json({ error: 'Invalid post slug' }, NO_STORE, { status: 400 })
      }

      if (!blogPosts.some((item) => item.slug === slug)) {
        return json({ error: 'Post not found' }, NO_STORE, { status: 404 })
      }

      const post = blogPosts.find((item) => item.slug === slug)

      if (!post) {
        return json({ error: 'Post not found' }, NO_STORE, { status: 404 })
      }

      return json({ generatedAt, post }, CONTENT_CACHE)
    }

    if (pathname.startsWith('/api/')) {
      return json({ error: 'API route not found' }, NO_STORE, { status: 404 })
    }

    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(request)
      return withSecurityHeaders(response, cacheForAsset(pathname, response))
    }

    return withSecurityHeaders(new Response('Not Found', { status: 404 }), NO_STORE)
  }
}
