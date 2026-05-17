# Operations

## 일상 운영 체크리스트
- 프론트 변경: `apps/web` 수정 후 배포 결과 확인
- API 변경: `apps/worker` 수정 후 `/api/health` 점검
- 콘텐츠 변경: `npm run build`로 생성 콘텐츠와 Worker API 번들 갱신 확인
- 환경변수 변경: `.env.example` 기준으로 Cloudflare `SUPABASE_URL`, `SUPABASE_ANON_KEY` 동기화

## 공개 API 점검
- `/api/health`: Worker 버전, 콘텐츠 개수, Supabase 설정 및 read 상태 확인
- `/api/news`: 뉴스 목록 JSON 확인
- `/api/posts`: 블로그 글 목록 JSON 확인
- `/api/posts/<slug>`: 개별 블로그 본문 JSON 확인
- 알 수 없는 `/api/*`: JSON 404 응답 확인

## 장애 대응
1. 최근 GitHub 커밋 확인
2. Cloudflare 배포 로그 확인
3. 직전 정상 커밋으로 롤백
