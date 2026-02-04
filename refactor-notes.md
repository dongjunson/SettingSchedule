# PMS 리팩토링 후보 분석

## 요약
- **React Query는 사이트/타임라인/체크리스트에만 적용**되어 있고, 그 외 서버 상태는 여전히 `useEffect + useState`로 관리되고 있음.
- **중복 UI/로직과 일관성 문제**가 여러 페이지에 분산되어 있음.
- **오래된 코드(_deprecated)와 경고성 UI(window.alert/confirm)**가 남아 있어 사용자 경험/유지보수에 부담.

아래는 실제 파일 근거 기반의 리팩토링 후보 목록입니다.

---

## 1) 서버 상태(React Query) 리팩토링 우선순위

### A. 손익계산서(IncomeStatement) – React Query로 전환 필요
- **파일**: `src/pages/IncomeStatementManagePage.jsx`
  - `useEffect`로 `fetchSiteById`, `fetchIncomeStatement`를 직접 호출하고 `loading/error`를 로컬 상태로 관리
  - 2분 자동 저장(autosave)도 `setInterval + useRef`로 직접 관리
- **관련 API**: `src/lib/api.js` (`fetchIncomeStatement`, `upsertIncomeStatement`)
- **개선 방향**
  - `useIncomeStatement(siteId)` + `useUpsertIncomeStatement()` 훅 도입
  - 서버 상태(데이터)와 UI 상태를 분리
  - autosave는 `useMutation` + `onSuccess` invalidation으로 일관성 유지

### B. 사이트 데이터 fetch/캐시 정책 정리
- **파일**: `src/hooks/useQueries.js`
  - `invalidateQueries` + `refetchQueries`를 동시에 호출하는 구간이 존재
  - `useSites`에서 `sort`와 `validateAndUpdateChecklist`가 queryFn 내부에 존재
- **개선 방향**
  - `invalidateQueries` 단독 사용 또는 `setQueryData`로 리스트 갱신
  - `select` 옵션을 활용해 데이터 변환/정렬을 queryFn 밖으로 분리
  - Query Key 상수화(예: `queryKeys.sites`, `queryKeys.site(siteId)`)

### C. Auth/Session 관련 서버 상태 분리
- **파일**: `src/App.jsx`, `src/pages/SetPasswordPage.jsx`, `src/lib/userStore.js`
  - Supabase 세션 처리가 컴포넌트에 직접 존재
- **개선 방향**
  - `useSession`, `useInviteRecoveryFlow` 같은 전용 훅으로 추출
  - 페이지 UI는 상태 결과만 소비하도록 단순화

---

## 2) 컴포넌트 구조/복잡도 리팩토링

### A. IncomeStatementManagePage (가장 큰 컴포넌트)
- **파일**: `src/pages/IncomeStatementManagePage.jsx`
  - 800+ 라인 규모, 상태/유틸/렌더가 한 파일에 집중
- **개선 방향**
  - 데이터 로딩/저장 로직을 커스텀 훅으로 분리
  - 계산 유틸(금액, 퍼센트, 그룹핑)을 `lib/utils` 또는 별도 모듈로 분리
  - 섹션별 UI 컴포넌트 분리 (헤더/매출/비용 테이블 등)

### B. TimelinePage
- **파일**: `src/pages/TimelinePage.jsx`
  - 역할 정규화, 상태 전환, 아이콘 렌더링 등 로직이 컴포넌트에 산재
- **개선 방향**
  - `renderStatusIcon`, subsection 토글/분리 로직을 별도 유틸로 분리
  - 섹션/서브섹션 렌더링 컴포넌트화

---

## 3) 중복 로직/컴포넌트 정리

### A. 프로젝트 리스트/필터링 중복
- **파일**: 
  - `src/pages/SiteSelection.jsx`
  - `src/pages/CompletedProjectsPage.jsx`
  - `src/pages/AdminHiddenProjectsPage.jsx`
  - `src/pages/AdminProjectManagePage.jsx`
  - `src/pages/IncomeStatementPage.jsx`
- **중복 패턴**
  - stage 필터링 및 리스트 렌더링 로직 반복
  - 유사한 카드/리스트 UI 반복
- **개선 방향**
  - `useSitesByStage(stage)` 훅 또는 `filterSites` 유틸 제공
  - 공통 리스트 컴포넌트 제작

### B. 진행도 계산 반복
- **파일**:
  - `src/hooks/useQueries.js` (calculateSiteProgress 사용)
  - `src/pages/TimelinePage.jsx`, `src/pages/ChecklistPage.jsx`, `src/pages/CompletedProjectsPage.jsx`
- **개선 방향**
  - 모든 진행도 계산은 `calculateSiteProgress`로 통일
  - 특정 페이지용 표시 로직은 컴포넌트 분리

---

## 4) 라우팅/구조 이슈

- **파일**: `src/App.jsx`
  - `admin/hidden-projects` 경로가 `AdminProjectManagePage`를 렌더링
  - 실제 전용 페이지는 `AdminHiddenProjectsPage.jsx` 존재
- **개선 방향**
  - 라우트 대상 정합성 점검 필요

---

## 5) 기술 부채 정리

- **사용되지 않는 레거시 스토어**
  - `src/lib/_deprecated/store.js`
  - 실제로는 React Query 전환이 진행되고 있음
  - 제거 또는 명확한 아카이빙 필요

- **에러 UI/알림 방식 불일치**
  - `window.alert/confirm` 사용 위치:
    - `src/pages/TimelinePage.jsx`
    - `src/pages/ChecklistPage.jsx`
    - `src/pages/SiteSelection.jsx`
    - `src/pages/AdminHiddenProjectsPage.jsx`
    - `src/pages/AdminProjectManagePage.jsx`
  - 반면 `IncomeStatementManagePage.jsx`는 `toast` 사용
  - **일관된 UI 알림 컴포넌트로 통일** 필요

---

## 6) UX/일관성 개선 포인트

- **로딩 스피너 UI 분산**
  - 일부는 `LoadingSpinner` 컴포넌트 사용
  - 일부는 인라인 로딩 UI 사용
  - 통일 필요 (예: 공통 로딩 컴포넌트만 사용)

---

## 제안된 실행 순서 (Phase)

**Phase 1: 서버 상태 통합**
1. IncomeStatementManagePage → React Query 전환
2. IncomeStatementPage → 동일 query 사용
3. useQueries.js 내부 정책 정리 (invalidate/refetch/keys)

**Phase 2: 중복 제거/구조 개선**
1. 프로젝트 리스트 공통화
2. TimelinePage/IncomeStatementManagePage 분리

**Phase 3: 기술 부채/UX 일관성**
1. _deprecated 스토어 정리
2. 알림/로딩 UI 통일
