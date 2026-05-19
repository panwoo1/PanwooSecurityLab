import { AgentStatusPreview } from '../components/agents/AgentStatusPreview'
import { SectionHeader } from '../components/layout/SectionHeader'

export function AgentsPage() {
  return (
    <>
      <SectionHeader
        eyebrow="AI agents"
        title="Agent dashboard"
        description="로컬 OpenHarness와 Discord agent 상태를 Cloudflare Tunnel을 통해 실시간으로 확인합니다."
      />
      <AgentStatusPreview />
    </>
  )
}
