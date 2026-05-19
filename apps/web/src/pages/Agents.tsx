import { AgentStatusPreview } from '../components/agents/AgentStatusPreview'
import { SectionHeader } from '../components/layout/SectionHeader'

export function AgentsPage() {
  return (
    <>
      <SectionHeader
        eyebrow="AI agents"
        title="Agent dashboard"
        description="로컬 Cloudflare API와 OpenHarness 상태를 기준으로 에이전트 메타데이터를 실시간 확인합니다."
      />
      <AgentStatusPreview />
    </>
  )
}
