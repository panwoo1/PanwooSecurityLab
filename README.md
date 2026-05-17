# PanwooSecurityLab

## 목표
- `assets/data/security-news.json` 기반 보안 뉴스 탭 제공
- `content/notes` 기반 블로그 탭 제공
- Cloudflare Workers API와 Supabase 연동 유지
- GitHub Actions로 뉴스 데이터 주기 업데이트

## 구조
```txt
/
├─ apps/
│  ├─ web/        # Vite + React frontend
│  └─ worker/     # Cloudflare Worker API
├─ assets/data/   # security-news.json source
├─ content/notes/ # blog markdown source
├─ docs/
├─ scripts/
├─ .github/workflows/
├─ .env.example
├─ README.md
└─ package.json
```

## 개발

```bash
npm install
npm run dev:web
```

프론트는 운영 환경에서 Worker 콘텐츠 API(`/api/news`, `/api/posts`, `/api/posts/:slug`)를 사용합니다.
`dev:web` 단독 실행 중 API가 없으면 개발 모드에서만 생성 콘텐츠 파일을 fallback으로 읽습니다.
Worker까지 포함해 확인하려면 `npm run dev:worker`를 실행합니다. 이 명령은 Vite dist를 먼저 만들고 루트 `wrangler.toml`의 assets 바인딩으로 Worker를 띄웁니다.

## 빌드

```bash
npm run build
```

`scripts/generate-web-content.mjs`가 뉴스와 블로그 원본을 `apps/web/src/generated-content.ts`와 `apps/worker/src/generated-content.ts`로 생성합니다.
