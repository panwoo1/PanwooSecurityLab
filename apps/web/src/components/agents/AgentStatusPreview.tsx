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
            <StatusCard
              eyebrow={roleDescription[role] ?? role}
              title={agent.display_name ?? role}
              description={agent.model ?? agent.bot_user_id ?? 'No model metadata reported'}
              status={status}
              meta={agent.bot_user_id ? `Discord bot: ${agent.bot_user_id}` : 'Connected through OpenHarness'}
              tone={toneFor(status)}
              key={`${role}-${agent.bot_user_id ?? agent.display_name ?? role}`}
            />
          )
        })}
      </section>
    </div>
  )
}
