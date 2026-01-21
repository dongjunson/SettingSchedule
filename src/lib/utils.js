import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ROLE, STATUS, STATUS_ORDER } from './constants';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// 상태 순환 함수 (pending -> working -> completed -> pending)
export const getNextStatus = (currentStatus) => {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus || STATUS.PENDING);
  return STATUS_ORDER[(currentIndex + 1) % STATUS_ORDER.length];
};

// 완료 시간 포맷 (MM/DD)
export const formatCompletedTime = (completedAt) => {
  if (!completedAt) return null;
  const date = new Date(completedAt);
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
};

// 날짜 포맷 (MM.DD)
export const formatDateShort = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}.${day}`;
};

// role 값 정규화 (공백 제거, 소문자 변환, 유효성 검증)
export const normalizeRole = (role) => {
  const normalized = (role || ROLE.BOTH).toString().trim().toLowerCase();
  if (normalized !== ROLE.RND && normalized !== ROLE.FIELD && normalized !== ROLE.BOTH) {
    return ROLE.BOTH;
  }
  return normalized;
};

// 상태에 따른 스타일 클래스 반환
export const getStatusColor = (status) => {
  switch (status) {
    case STATUS.COMPLETED:
      return 'bg-blue-500 text-white hover:bg-blue-600 hover:text-white shadow-md shadow-blue-500/30';
    case STATUS.WORKING:
      return 'bg-gray-500 text-white hover:bg-gray-600 hover:text-white shadow-md shadow-gray-500/30';
    default:
      return 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-muted-foreground border border-border/60';
  }
};

// step 문자열을 정렬용 숫자 배열로 파싱 (예: '1-05' -> [1, 5])
export const parseStepForSort = (step) => {
  const s = (step || '').toString();
  const m = s.match(/^(\d+)-(\d+)$/);
  if (!m) return [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  return [Number(m[1]), Number(m[2])];
};
