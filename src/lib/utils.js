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

// 사이트 진행도 계산
export const calculateSiteProgress = (site, weights = { timeline: 0.7, checklist: 0.3 }) => {
  if (!site) return { timeline: 0, checklist: 0, overall: 0, working: 0, completed: 0, total: 0 };

  const timelineTotal = site.timeline?.length || 0;
  const timelineCompleted =
    site.timeline?.filter((item) => item.status === STATUS.COMPLETED).length || 0;
  const timelineWorking =
    site.timeline?.filter((item) => item.status === STATUS.WORKING).length || 0;
  const timelineProgress = timelineTotal > 0 ? (timelineCompleted / timelineTotal) * 100 : 0;

  const checklistTotal = site.checklist?.length || 0;
  const checklistCompleted = site.checklist?.filter((item) => item.checked).length || 0;
  const checklistProgress = checklistTotal > 0 ? (checklistCompleted / checklistTotal) * 100 : 0;

  const overallProgress = timelineProgress * weights.timeline + checklistProgress * weights.checklist;

  return {
    timeline: Math.round(timelineProgress),
    checklist: Math.round(checklistProgress),
    overall: Math.round(overallProgress),
    working: timelineWorking,
    completed: timelineCompleted,
    total: timelineTotal,
  };
};

// 체크리스트 검증 및 정규화
export const validateAndUpdateChecklist = (checklist, getTemplate) => {
  const initialChecklist = getTemplate().map((item, idx) => ({
    id: idx + 1,
    ...item,
    checked: false,
  }));

  if (!Array.isArray(checklist) || checklist.length === 0) {
    return initialChecklist;
  }

  const normalized = checklist
    .filter((item) => item && item.id != null && typeof item.text === 'string')
    .map((item) => ({
      ...item,
      checked: Boolean(item.checked),
    }));

  if (normalized.length === 0) {
    return initialChecklist;
  }

  const orderMap = new Map(initialChecklist.map((b, idx) => [b.text, idx]));
  normalized.sort(
    (a, b) =>
      (orderMap.get(a.text) ?? Number.POSITIVE_INFINITY) -
      (orderMap.get(b.text) ?? Number.POSITIVE_INFINITY)
  );

  return normalized;
};

// 상태 아이콘 반환
export const getStatusIcon = (status) => {
  switch (status) {
    case STATUS.COMPLETED:
      return 'CheckCircle';
    case STATUS.WORKING:
      return 'Clock';
    default:
      return 'Circle';
  }
};
