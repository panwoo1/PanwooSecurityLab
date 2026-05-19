import { useEffect, useState } from 'react'
import { StatusCard } from '../dashboard/StatusCard'
import type { HarnessAgent, HarnessJob } from '../../types'

type HarnessHealth = {
  ok?: boolean
  status?: string
  service?: string
}

type LoadState = {
  agents: HarnessAgent[]
  jobs: HarnessJob[]
  health: HarnessHealth | null
  status: 'loading' | 'ready' | 'error'
  error: string | null
}

const roleDescription: Record<string, string> = {
  master: 'Planning, handoff, retry, escalation',
  coder: 'Implementation and validation commands',
  qa: 'Quality gate and regression review',
  security: 'Security, policy, and operation risk gate'
}

const roleAvatar: Record<string, string> = {
  master: '🧠',
  coder: '🛠️',
  qa: '🧪',
  security: '🛡️'
}

const roleAccent: Record<string, string> = {
  master: 'from-violet-500/18 to-blue-500/8 text-violet-100 ring-violet-400/20',
  coder: 'from-cyan-500/18 to-sky-500/8 text-cyan-100 ring-cyan-400/20',
  qa: 'from-emerald-500/18 to-teal-500/8 text-emerald-100 ring-emerald-400/20',
  security: 'from-amber-500/18 to-orange-500/8 text-amber-100 ring-amber-400/20'
}

function agentPortrait(role: string) {
  return roleAvatar[role] ?? '🤖'
}

function accentFor(role: string) {
  return roleAccent[role] ?? 'from-slate-500/18 to-slate-600/8 text-slate-100 ring-white/10'
}

function connectedMeta(agent: HarnessAgent) {
  if (agent.bot_user_id) {
    return `Discord bot: ${agent.bot_user_id}`
  }

  if (agent.role) {
    return `Connected through OpenHarness · ${agent.role}`
  }

  return 'Connected through OpenHarness'
}

function agentLabel(agent: HarnessAgent) {
  return agent.display_name ?? agent.role ?? 'Agent'
}

function agentSummary(agent: HarnessAgent) {
  return agent.model ?? agent.bot_user_id ?? 'Live metadata available from the local dashboard API'
}

function asArray<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) {
    return value as T[]
  }

  if (value && typeof value === 'object') {
    const nested = (value as Record<string, unknown>)[key]
    return Array.isArray(nested) ? (nested as T[]) : []
  }

  return []
}

async function readJson(path: string) {
  const response = await fetch(path, { cache: 'no-store' })

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`)
  }

  return response.json()
}

function toneFor(status?: string): 'slate' | 'blue' | 'amber' | 'red' {
  const normalized = status?.toLowerCase() ?? ''

  if (['running', 'working', 'online', 'ready', 'ok'].some((item) => normalized.includes(item))) {
    return 'blue'
  }

  if (['error', 'failed', 'blocked', 'offline'].some((item) => normalized.includes(item))) {
    return 'red'
  }

  if (['pending', 'waiting', 'planning', 'retry'].some((item) => normalized.includes(item))) {
    return 'amber'
  }

  return 'slate'
}

export function AgentStatusPreview() {
  const [state, setState] = useState<LoadState>({
    agents: [],
    jobs: [],
    health: null,
    status: 'loading',
    error: null
  })

  useEffect(() => {
    let cancelled = false

    async function loadAgents() {
      try {
        const [health, agentsResult, jobsResult] = await Promise.all([
          readJson('/api/harness/health'),
          readJson('/api/agents'),
          readJson('/api/jobs?limit=8')
        ])

        if (!cancelled) {
          setState({
            agents: asArray<HarnessAgent>(agentsResult, 'agents'),
            jobs: asArray<HarnessJob>(jobsResult, 'jobs'),
            health,
            status: 'ready',
            error: null
          })
        }
      } catch (error) {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to load agent dashboard'
          }))
        }
      }
    }

    loadAgents()
    const timer = window.setInterval(loadAgents, 15000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const runtimeStatus = state.health?.ok ? 'Connected' : state.status === 'loading' ? 'Loading' : 'Disconnected'
  const runtimeTone = state.health?.ok ? 'blue' : state.status === 'error' ? 'red' : 'amber'

  return (
    <div className="space-y-5">
      <StatusCard
        eyebrow="OpenHarness runtime"
        title="Local agent bridge"
        description={state.error ?? `${state.jobs.length} recent jobs visible through the dashboard API`}
        status={runtimeStatus}
        meta={state.health?.status ?? state.health?.service ?? 'Polling every 15 seconds'}
        tone={runtimeTone}
      />

      <section className="grid gap-3 md:grid-cols-2">
        {state.agents.map((agent) => {
          const role = agent.role ?? 'agent'
          const status = agent.status ?? (state.health?.ok ? 'Ready' : 'Unknown')

          return (
            <article
              className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_18px_60px_rgba(2,6,23,0.24)]"
              key={`${role}-${agent.bot_user_id ?? agent.display_name ?? role}`}
            >
              <div className="flex items-start gap-4 p-4 sm:p-5">
                <div
                  className={`agent-portrait flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl ring-1 ${accentFor(role)}`}
                  aria-hidden="true"
                >
                  <span>{agentPortrait(role)}</span>
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        {roleDescription[role] ?? role}
                      </p>
                      <h3 className="mt-1 truncate text-lg font-semibold text-white">{agentLabel(agent)}</h3>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-200">
                      {status}
                    </span>
                  </div>
                  <p className="m-0 text-sm text-slate-300">{agentSummary(agent)}</p>
                  <p className="m-0 text-xs text-slate-500">{connectedMeta(agent)}</p>
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
