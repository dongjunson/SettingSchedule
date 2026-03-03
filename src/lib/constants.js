// 프로젝트 전역에서 사용되는 상수 정의

// 타임라인 항목 상태
export const STATUS = {
  PENDING: 'pending',
  WORKING: 'working',
  COMPLETED: 'completed',
};

// 상태 순환 순서 (pending -> working -> completed -> pending)
export const STATUS_ORDER = [STATUS.PENDING, STATUS.WORKING, STATUS.COMPLETED];

// 상태 표시 라벨
export const STATUS_LABELS = {
  [STATUS.PENDING]: '대기',
  [STATUS.WORKING]: '작업중',
  [STATUS.COMPLETED]: '완료',
};

// 프로젝트 단계 (sites.stage)
export const STAGE = {
  IN_PROGRESS: '구축중',
  COMPLETED: '구축완료',
};

export const STAGE_LABELS = {
  [STAGE.IN_PROGRESS]: '구축중',
  [STAGE.COMPLETED]: '구축완료',
  [null]: '영업중',
};

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  SITE_TIMELINE: 'site_timeline_data',
  CURRENT_USER: 'current_user',
  REMEMBERED_USER_ID: 'remembered_user_id',
};

// Supabase 환경 변수 설정 여부
export const hasSupabaseEnv = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

// 사용자 그룹
export const USER_GROUPS = {
  ADMIN: '관리자',
  RND: 'R&D',
  FIELD: '사업지원팀',
};

// 진행도 계산 가중치
export const PROGRESS_WEIGHTS = {
  TIMELINE: 0.7,
  CHECKLIST: 0.3,
};

// API 설정
export const API_CONFIG = {
  TIMEOUT: 10000,
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
};

// Fallback 사용자 (Supabase 미설정 시)
export const FALLBACK_USERS = [
  { id: 'admin', email: 'admin@saferobo.co.kr', password: 'joy&rising', group: USER_GROUPS.ADMIN },
  { id: 'rnd', email: 'rnd@saferobo.co.kr', password: 'joy&rising', group: USER_GROUPS.RND },
  {
    id: 'system',
    email: 'system@saferobo.co.kr',
    password: 'joy&rising',
    group: USER_GROUPS.FIELD,
  },
];

// 에러 메시지
export const ERROR_MESSAGES = {
  SESSION_EXPIRED: '인증이 만료되었습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.',
  SESSION_REFRESH_FAILED: '세션을 갱신할 수 없습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.',
  SYSTEM_NOT_CONFIGURED: '시스템이 올바르게 설정되지 않았습니다. 관리자에게 문의해 주세요.',
  SERVICE_UNAVAILABLE: '서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다. 연결 상태를 확인해 주세요.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
  LOGIN_FAILED: '로그인에 실패했습니다.',
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  PROJECT_NOT_FOUND: '프로젝트를 찾을 수 없습니다.',
  UPDATE_FAILED: '업데이트에 실패했습니다.',
  DELETE_FAILED: '삭제에 실패했습니다.',
  CREATE_FAILED: '생성에 실패했습니다.',
};
