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

## 빌드

```bash
npm run build
```

`apps/web` 빌드 전 `scripts/generate-web-content.mjs`가 뉴스와 블로그 원본을 `apps/web/src/generated-content.ts`로 생성합니다.
