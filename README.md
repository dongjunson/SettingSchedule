# 사업소 타임라인 관리 시스템

React + Vite + shadcn/ui + Tailwind CSS + Lucide + Recharts를 사용한 사업소 타임라인 및 체크리스트 관리 시스템입니다.

## 기능

- 🏢 **사업소 선택**: 첫 화면에서 사업소를 선택하여 해당 타임라인과 체크리스트 확인
- 📅 **타임라인 관리**: R&D와 현장팀의 작업 진행 상황을 실시간으로 체크하고 업데이트
- ✅ **체크리스트 관리**: 시스템 기능 점검 항목을 체크하고 진행도 추적
- 📊 **진행도 차트**: Recharts를 사용한 시각적인 진행도 차트
- 💾 **로컬 저장소**: localStorage를 사용한 데이터 영구 저장

## 기술 스택

- **React 18**: UI 라이브러리
- **Vite**: 빌드 도구
- **React Router**: 라우팅
- **Tailwind CSS**: 스타일링
- **shadcn/ui**: UI 컴포넌트
- **Lucide React**: 아이콘
- **Recharts**: 차트 라이브러리

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속하세요.

### 3. 빌드

```bash
npm run build
```

## 프로젝트 구조

```
sample-schedule/
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/ui 컴포넌트
│   │   └── ProgressChart.jsx
│   ├── lib/
│   │   ├── storage.js   # localStorage 관리
│   │   └── utils.js     # 유틸리티 함수
│   ├── pages/
│   │   ├── SiteSelection.jsx  # 사업소 선택 페이지
│   │   ├── TimelinePage.jsx   # 타임라인 페이지
│   │   └── ChecklistPage.jsx  # 체크리스트 페이지
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 사용 방법

1. **사업소 선택**: 첫 화면에서 사업소 카드를 클릭하여 해당 사업소의 타임라인으로 이동
2. **타임라인 관리**: 각 작업 항목의 R&D 또는 현장팀 버튼을 클릭하여 상태 변경 (대기 → 작업중 → 완료)
3. **체크리스트 확인**: 상단의 "점검 리스트" 버튼을 클릭하여 체크리스트 페이지로 이동
4. **체크리스트 체크**: 각 항목의 체크박스를 클릭하여 완료 상태 변경

## 데이터 저장

모든 데이터는 브라우저의 localStorage에 저장되며, 페이지를 새로고침해도 데이터가 유지됩니다.

## 라이선스

MIT
