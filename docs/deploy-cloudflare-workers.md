# Cloudflare Workers 배포

## 브라우저 기반 준비
1. Cloudflare Workers project 연결
2. 환경변수 설정
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Supabase에 `app_messages` 테이블 생성

`SUPABASE_URL`은 `https://<project-ref>.supabase.co` 형식의 프로젝트 URL을 사용하세요.
이 Worker 경로에는 `service_role` key를 넣지 말고 anon key만 등록합니다.

```sql
create table if not exists app_messages (
  key text primary key,
  value text not null
);

alter table app_messages enable row level security;

create policy "Allow public read for home message"
on app_messages
for select
to anon
using (key = 'home');

insert into app_messages (key, value)
values ('home', 'Hello from Supabase')
on conflict (key) do update set value = excluded.value;
```

## GitHub Actions 기반 배포(권장)
- GitHub Secrets
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
- Actions에서 `wrangler deploy` 실행

## 직접 배포(로컬 가능 시)
```bash
cd apps/worker
npm run deploy
```
