export interface Env {
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
}

const DEFAULT_MESSAGE = 'Hello from Cloudflare Worker'

function isSupabaseProjectUrl(url: URL): boolean {
  return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co')
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname === '/api/health') {
      return Response.json({
        ok: true,
        service: 'worker',
        database: env.SUPABASE_URL && env.SUPABASE_ANON_KEY ? 'supabase' : 'not-configured'
      })
    }

    if (pathname === '/api/message') {
      const message = await getMessageFromSupabase(env)
      return Response.json({ message })
    }

    return new Response('Not Found', { status: 404 })
  }
}
