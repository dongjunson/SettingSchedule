# PMS 프로젝트 리팩토링 보고서

## ✅ 완료된 작업

### Phase 0: Quick Wins
| 작업 | 상태 | 상세 |
|------|------|------|
| Deprecated 디렉토리 삭제 | ✅ 완료 | `src/lib/_deprecated`, `src/components/_deprecated` 삭제 |
| `useQueries.js` 중복 refetch 제거 | ✅ 완료 | `invalidateQueries` 후 불필요한 `refetchQueries` 호출 제거 |
| 라우팅 버그 수정 | ✅ 완료 | `/admin/hidden-projects`가 `AdminHiddenProjectsPage`를 렌더링하도록 수정 |

### Phase 1: 코어 리팩토링
| 작업 | 상태 | 상세 |
|------|------|------|
| Query Keys 중앙화 | ✅ 완료 | `src/lib/queryKeys.js` 생성 — 모든 queryKey를 한 곳에서 관리 |
| 숫자 유틸리티 추출 | ✅ 완료 | `src/lib/numberUtils.js` 생성 — `toNumber`, `formatNumber`, `formatInputNumber` 등 |
| 손익계산서 상수 분리 | ✅ 완료 | `src/lib/incomeConstants.js` 생성 — 템플릿 데이터, 결제 유형, 기본 항목 빌더 |
| `AmountInput` 컴포넌트 추출 | ✅ 완료 | `src/components/income/AmountInput.jsx` — 금액 입력/표시 전용 컴포넌트 |
| `TimelineItemCard` 컴포넌트 추출 | ✅ 완료 | `src/components/timeline/TimelineItemCard.jsx` — 모바일/데스크톱 공통화 |
| `useIncomeStatement` 훅 추가 | ✅ 완료 | React Query 기반 손익계산서 데이터 로딩 |
| `useUpsertIncomeStatement` 훅 추가 | ✅ 완료 | React Query 기반 손익계산서 저장 mutation |
| **IncomeStatementManagePage 리팩토링** | ✅ 완료 | **1,042줄 → ~350줄** (66% 감소) |
| **TimelinePage 리팩토링** | ✅ 완료 | **728줄 → ~280줄** (62% 감소) |
| `window.alert` → `toast` 전환 | ✅ 완료 | 전체 프로젝트에서 `window.alert` 제거 |
| 로딩 UI 통일 | ✅ 완료 | 인라인 스피너 → `LoadingSpinner` 컴포넌트 통일 |

## 생성된 파일 목록

| 파일 | 용도 |
|------|------|
| `src/lib/queryKeys.js` | React Query 키 중앙 관리 |
| `src/lib/numberUtils.js` | 숫자 포맷팅/변환 유틸리티 |
| `src/lib/incomeConstants.js` | 손익계산서 상수 및 기본 데이터 빌더 |
| `src/components/income/AmountInput.jsx` | 금액 입력/표시 컴포넌트 |
| `src/components/timeline/TimelineItemCard.jsx` | 타임라인 아이템 공통 컴포넌트 |

## 수정된 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/hooks/useQueries.js` | queryKeys 적용, 중복 refetch 제거, 손익계산서 훅 추가 |
| `src/pages/IncomeStatementManagePage.jsx` | 전면 리팩토링 (React Query, 컴포넌트 분리) |
| `src/pages/TimelinePage.jsx` | 전면 리팩토링 (중복 코드 제거, 공통 컴포넌트) |
| `src/pages/ChecklistPage.jsx` | window.alert → toast |
| `src/pages/SiteSelection.jsx` | window.alert → toast |
| `src/pages/AdminProjectManagePage.jsx` | window.alert → toast, 로딩 UI 통일 |
| `src/pages/AdminHiddenProjectsPage.jsx` | window.alert → toast, 로딩 UI 통일 |
| `src/App.jsx` | 라우팅 버그 수정 (hidden-projects) |

## 🔮 추후 개선 가능 사항 (Phase 2+)

### 코드 분할
- Vite 빌드 경고: 번들 1.6MB → `React.lazy()` + `import()` 적용으로 개선 가능

### 추가 리팩토링
- `SiteSelection.jsx` (346줄) — 카드 렌더링 컴포넌트 분리 가능
- `AdminProjectManagePage.jsx` (335줄) — `StageSection` 컴포넌트를 별도 파일로 분리 가능
- `exportExcel.js` (634줄) — `numberUtils.js`의 유틸리티 함수 활용으로 중복 제거
- `window.confirm` → 커스텀 확인 다이얼로그 컴포넌트 (shadcn AlertDialog 활용)

### 테스트
- 핵심 유틸리티 함수 단위 테스트 추가 (numberUtils, queryKeys)
- React Query 훅 통합 테스트
