import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '..')
const newsPath = path.join(root, 'assets', 'data', 'security-news.json')
const outputPath = path.join(root, 'docs', 'info-security-exam-questions.pdf')

function normalized(value) {
  return String(value || '').toLowerCase().trim()
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

function buildChoices(answer, distractors, seed) {
  const choices = [answer, ...distractors]
  const offset = seed.charCodeAt(0) % choices.length
  return [...choices.slice(offset), ...choices.slice(0, offset)]
}

function articleBasis(item) {
  return item.articleText || item.summary || item.title
}

function contextFromArticle(item, keywords) {
  const fallback = item.summary || item.title
  const sentences = articleBasis(item)
    .split(/(?<=[.!?。！？다])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 24)
  const keywordSentence = sentences.find((sentence) => keywords.some((keyword) => normalized(sentence).includes(normalized(keyword))))
  const context = keywordSentence || sentences[0] || fallback
  return context.length > 260 ? `${context.slice(0, 257)}...` : context
}

function createQuestion(item, keywords) {
  const matchedTopic =
    examTopics.find(({ keywords: topicKeywords }) => topicKeywords.some((keyword) => keywords.includes(keyword))) ?? examTopics[2]

  return {
    source: item.source,
    published: item.published,
    title: item.title,
    topic: matchedTopic.topic,
    stem: matchedTopic.stem,
    context: contextFromArticle(item, keywords),
    choices: buildChoices(matchedTopic.answer, matchedTopic.distractors, item.slug),
    answer: matchedTopic.answer,
    explanation: `${keywords.slice(0, 3).join(', ')} 키워드가 기사 내용에서 확인되므로 ${matchedTopic.explanation}`
  }
}

function scoreItem(item) {
  const title = normalized(item.title)
  const summary = normalized(item.summary)
  const articleText = normalized(item.articleText)
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

  return { score, date: new Date(item.published).getTime() || 0, question: createQuestion(item, keywords) }
}

function lineWidth(value) {
  let width = 0
  for (const char of value) {
    if (char === ' ') width += 0.35
    else if (char.charCodeAt(0) < 128) width += 0.55
    else width += 1
  }
  return width
}

function wrapText(value, maxWidth) {
  const words = String(value || '').replace(/\s+/g, ' ').trim().split(' ')
  const lines = []
  let line = ''

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (line && lineWidth(candidate) > maxWidth) {
      lines.push(line)
      line = word
      continue
    }

    if (lineWidth(candidate) <= maxWidth) {
      line = candidate
      continue
    }

    let chunk = ''
    for (const char of word) {
      const next = `${chunk}${char}`
      if (chunk && lineWidth(next) > maxWidth) {
        lines.push(chunk)
        chunk = char
      } else {
        chunk = next
      }
    }
    line = chunk
  }

  if (line) lines.push(line)
  return lines
}

function hexUtf16(value) {
  return Buffer.from(String(value), 'utf16le').swap16().toString('hex').toUpperCase()
}

function textOp(x, y, size, text) {
  return `BT /F1 ${size} Tf 1 0 0 1 ${x} ${y} Tm <${hexUtf16(text)}> Tj ET\n`
}

function buildPages(lines) {
  const pages = []
  let ops = ''
  let y = 800

  function pushPage() {
    pages.push(ops)
    ops = ''
    y = 800
  }

  for (const line of lines) {
    if (line.type === 'space') {
      y -= line.height
      if (y < 56) pushPage()
      continue
    }

    const size = line.size ?? 10
    const leading = line.leading ?? Math.ceil(size * 1.5)
    if (y < 56) pushPage()
    ops += textOp(line.x ?? 48, y, size, line.text)
    y -= leading
  }

  if (ops) pushPage()
  return pages
}

function buildPdf(pageStreams) {
  const objects = []
  const add = (body) => {
    objects.push(body)
    return objects.length
  }

  const catalogId = add('<< /Type /Catalog /Pages 2 0 R >>')
  const pagesId = add('')
  const fontId = add('<< /Type /Font /Subtype /Type0 /BaseFont /HYGoThic-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [4 0 R] >>')
  add('<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYGoThic-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> >>')

  const pageIds = []
  for (const stream of pageStreams) {
    const contentId = add(`<< /Length ${Buffer.byteLength(stream, 'binary')} >>\nstream\n${stream}endstream`)
    const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`)
    pageIds.push(pageId)
  }
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
  const offsets = [0]
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, 'binary'))
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`
  })
  const xref = Buffer.byteLength(pdf, 'binary')
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(pdf, 'binary')
}

const payload = JSON.parse(fs.readFileSync(newsPath, 'utf8'))
const questions = payload.items
  .map(scoreItem)
  .filter(Boolean)
  .sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.date - a.date
  })
  .map(({ question }) => question)

const lines = [
  { text: '정보보안기사 기사 기반 예상문제', size: 18, leading: 26 },
  { text: `생성 기준: ${payload.generated_at || ''} / 문제 수: ${questions.length}`, size: 10, leading: 18 },
  { text: '각 문항은 수집 기사 본문에서 추출한 상황을 바탕으로 한 학습용 예상문제입니다.', size: 10, leading: 18 },
  { type: 'space', height: 12 }
]

questions.forEach((question, index) => {
  lines.push({ text: `${index + 1}. [${question.topic}] ${question.stem}`, size: 12, leading: 20 })
  wrapText(`상황: ${question.context}`, 63).forEach((text) => lines.push({ text, size: 9, leading: 14, x: 54 }))
  question.choices.forEach((choice, choiceIndex) => {
    wrapText(`${choiceIndex + 1}) ${choice}`, 64).forEach((text) => lines.push({ text, size: 10, leading: 15, x: 58 }))
  })
  wrapText(`정답: ${question.answer}`, 64).forEach((text) => lines.push({ text, size: 10, leading: 15, x: 58 }))
  wrapText(`해설: ${question.explanation}`, 64).forEach((text) => lines.push({ text, size: 9, leading: 14, x: 58 }))
  lines.push({ text: `출처: ${question.source} / ${question.title}`, size: 8, leading: 13, x: 58 })
  lines.push({ type: 'space', height: 12 })
})

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, buildPdf(buildPages(lines)))
console.log(`Wrote ${path.relative(root, outputPath)} with ${questions.length} questions.`)
