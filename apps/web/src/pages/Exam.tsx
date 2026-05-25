import type { NewsItem } from '../generated-content'
import { SectionHeader } from '../components/layout/SectionHeader'
import { NewsToolbar } from '../components/news/NewsToolbar'

export type ExamCandidate = {
  item: NewsItem
  score: number
  keywords: string[]
  question: ExamQuestion
}

export type ExamQuestion = {
  topic: string
  stem: string
  context: string
  choices: string[]
  answer: string
  explanation: string
}

export function ExamPage({
  candidates,
  query,
  totalCount,
  generatedAt,
  onQueryChange,
  formatDate
}: {
  candidates: ExamCandidate[]
  query: string
  totalCount: number
  generatedAt: string
  onQueryChange: (query: string) => void
  formatDate: (value: string) => string
}) {
  return (
    <>
      <SectionHeader
        eyebrow="InfoSec engineer"
        title="정보보안기사 예상문제"
        description="수집된 기사 제목과 요약을 근거로 정보보안기사식 객관식 문제를 생성합니다."
      />
      <NewsToolbar
        query={query}
        resultCount={candidates.length}
        totalCount={totalCount}
        label="예상문제 검색"
        placeholder="키워드, 기사, 주제 검색"
        onQueryChange={onQueryChange}
      />
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">Generated at {formatDate(generatedAt)}</p>
      {candidates.length ? (
        <section className="grid gap-3" aria-label="Exam question list">
          {candidates.map(({ item, score, keywords, question }, index) => (
            <article className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_10px_30px_rgba(2,6,23,0.18)] sm:p-5" key={item.slug}>
              <div className="flex flex-wrap items-center gap-2 text-[0.72rem] font-semibold leading-none">
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1.5 text-emerald-200">예상문제 {index + 1}</span>
                <span className="rounded-full border border-blue-400/25 bg-blue-400/10 px-2.5 py-1.5 text-blue-200">{question.topic}</span>
                <span className="rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1.5 text-slate-400">score {score}</span>
              </div>

              <div className="grid gap-2">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {item.source} · {formatDate(item.published)}
                </p>
                <h3 className="m-0 text-[1.04rem] font-bold leading-snug text-white sm:text-[1.18rem]">{question.stem}</h3>
                <p className="m-0 rounded-xl border border-white/10 bg-slate-950/35 p-3 text-sm leading-6 text-slate-300">상황: {question.context}</p>
              </div>

              <ol className="grid list-none gap-2 p-0">
                {question.choices.map((choice, choiceIndex) => {
                  const isAnswer = choice === question.answer
                  return (
                    <li
                      className={[
                        'rounded-xl border px-3 py-2 text-sm font-semibold',
                        isAnswer ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100' : 'border-white/10 bg-slate-950/35 text-slate-300'
                      ].join(' ')}
                      key={choice}
                    >
                      {choiceIndex + 1}. {choice}
                    </li>
                  )
                })}
              </ol>

              <div className="grid gap-2 rounded-xl border border-white/10 bg-slate-950/45 p-3">
                <p className="m-0 text-sm font-semibold text-emerald-100">정답: {question.answer}</p>
                <p className="m-0 text-sm leading-6 text-slate-300">{question.explanation}</p>
                <p className="m-0 text-sm leading-6 text-slate-400">근거: {question.context}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {keywords.slice(0, 5).map((keyword) => (
                  <span className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[0.72rem] font-semibold text-slate-300" key={keyword}>
                    {keyword}
                  </span>
                ))}
                <a
                  className="ml-auto rounded-full border border-blue-400/25 bg-blue-400/10 px-3 py-1.5 text-sm font-semibold text-blue-200 transition-all hover:border-blue-300/40 hover:bg-blue-400/15 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  원문 열기
                </a>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm text-slate-400">조건에 맞는 예상문제가 없습니다.</p>
      )}
    </>
  )
}
