# PMS (사업소 타임라인 관리 시스템)

React + Vite 기반의 사업소 운영 프로젝트 관리 도구입니다. 타임라인/체크리스트 진행 관리, 손익계산서 관리, 관리자 사용자 초대/관리 기능을 제공합니다.

## 핵심 기능

- 사업소별 타임라인 진행 관리 (대기/작업중/완료, 완료자/완료시각 기록)
- 사업소별 체크리스트 관리
- 진행도 시각화 (전체/타임라인/체크리스트)
- 손익계산서(매출/지출) 입력 및 엑셀 내보내기
- 관리자 전용 기능
  - 신규 프로젝트 등록/수정/삭제
  - 사용자 초대(Edge Function)
  - Auth 사용자 목록/삭제(Vercel Serverless)

## 기술 스택

- Frontend: React 18, Vite 5, React Router 6
- UI: Tailwind CSS, shadcn/ui, Lucide
- Data: Supabase (`@supabase/supabase-js`), TanStack Query, Zustand
- Export: `xlsx-js-style`
- Tooling: Biome

## 요구 사항

- Node.js 18+
- npm
- (권장) Supabase 프로젝트

## 시작하기

1) 의존성 설치

```bash
npm install
```

2) 환경 변수 설정 (`.env`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 선택: 로컬에서 /api/auth-users를 배포 앱으로 프록시
# VITE_VERCEL_APP_URL=https://your-app.vercel.app

# 선택: Supabase 미설정 시 fallback REST API 주소
# VITE_API_BASE_URL=http://localhost:3000/api
```

3) 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 스크립트

```bash
npm run dev        # 개발 서버
npm run build      # 프로덕션 빌드
npm run preview    # 빌드 결과 로컬 확인
npm run lint       # Biome lint
npm run lint:fix   # Biome lint 자동 수정
npm run format     # Biome format
npm run check      # Biome 종합 검사
npm run check:fix  # Biome 검사 자동 수정
```

## 라우트 구조

- 공개
  - `/login`
  - `/set-password`
- 로그인 필요
  - `/` (구축중 프로젝트)
  - `/completed-projects`
  - `/site/:siteId`
  - `/site/:siteId/checklist`
- 관리자 전용
  - `/income-statement`
  - `/income-statement/manage`
  - `/admin/new-project`
  - `/admin/invite-user`
  - `/admin/users`
  - `/admin/projects`
  - `/admin/hidden-projects`

## 디렉터리 개요

```
.
├── src/
│   ├── components/         # 공통 UI, 라우트 가드, 타임라인 컴포넌트
│   ├── hooks/              # React Query hooks
│   ├── lib/                # api/supabase/store/constants/export
│   └── pages/              # 화면 단위 페이지
├── api/
│   └── auth-users.js       # Vercel Serverless (관리자 사용자 목록/삭제)
├── supabase/functions/
│   ├── invite-user/        # Edge Function (사용자 초대)
│   └── auth-users/         # Edge Function 버전(참고/대안)
├── vercel.json             # rewrite 설정
└── supabase-setup-manual.md
```

## 배포 및 백엔드 연동

### 1) Supabase

- DB/RLS/RPC 초기 설정은 `supabase-setup-manual.md` 참고
- 필수 클라이언트 환경 변수
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### 2) 사용자 초대 API (`/api/invite-user`)

- 앱은 `/api/invite-user`로 호출하고, `vercel.json`이 Supabase Edge Function으로 rewrite
- Edge Function `invite-user`를 Supabase에 배포해야 동작

### 3) 사용자 관리 API (`/api/auth-users`)

- Vercel Serverless 함수 `api/auth-users.js` 사용
- Vercel 환경 변수 필요
  - `SUPABASE_URL` (또는 `VITE_SUPABASE_URL`)
  - `SUPABASE_ANON_KEY` (또는 `VITE_SUPABASE_ANON_KEY`)
  - `SUPABASE_SERVICE_ROLE_KEY`
- 로컬 개발에서 같은 엔드포인트 테스트 시 `VITE_VERCEL_APP_URL` 설정 가능

## 참고 문서

- `supabase-setup-manual.md`: Supabase 생성, 테이블/RLS/RPC, Edge Function 배포
- `database-schema.md`: 테이블 스키마
- `api-spec.md`: 클라이언트 데이터 접근 규약

## 라이선스

MIT
