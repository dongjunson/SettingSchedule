// 프로젝트 전역에서 사용되는 상수 정의

// 타임라인 항목 상태
export const STATUS = {
  PENDING: 'pending',
  WORKING: 'working',
  COMPLETED: 'completed',
};

// 상태 순환 순서 (pending -> working -> completed -> pending)
export const STATUS_ORDER = [STATUS.PENDING, STATUS.WORKING, STATUS.COMPLETED];

// 담당 역할
export const ROLE = {
  RND: 'rnd',
  FIELD: 'field',
  BOTH: 'both',
};

// 역할 표시 라벨
export const ROLE_LABELS = {
  [ROLE.RND]: 'R&D',
  [ROLE.FIELD]: '사업지원팀',
  [ROLE.BOTH]: '공동',
};

// 상태 표시 라벨
export const STATUS_LABELS = {
  [STATUS.PENDING]: '대기',
  [STATUS.WORKING]: '작업중',
  [STATUS.COMPLETED]: '완료',
};

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  SITE_TIMELINE: 'site_timeline_data',
  CURRENT_USER: 'current_user',
  REMEMBERED_USER_ID: 'remembered_user_id',
};
