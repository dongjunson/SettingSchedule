// 숫자 포맷팅/변환 유틸리티
// IncomeStatementManagePage와 exportExcel 등에서 공유됩니다.

/**
 * 문자열/숫자를 안전하게 number로 변환 (콤마 제거 포함)
 */
export const toNumber = (value) => {
  if (value == null || value === '') return 0;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isNaN(n) ? 0 : n;
};

/**
 * 숫자를 한국어 로케일 콤마 포맷으로 변환 (표시용)
 */
export const formatNumber = (value) => {
  if (value == null || Number.isNaN(value)) return '-';
  return value.toLocaleString('ko-KR');
};

/**
 * 입력값에 세자리 콤마 적용 (입력 필드용)
 */
export const formatInputNumber = (value) => {
  if (value == null || value === '') return '';
  const numericValue = String(value).replace(/[^\d]/g, '');
  if (numericValue === '') return '';
  return Number(numericValue).toLocaleString('ko-KR');
};

/**
 * 퍼센트 포맷 (소수점 2자리)
 */
export const formatPercent = (value) => `${value.toFixed(2)}%`;

/**
 * 비율 계산 (분모가 0이면 0 반환)
 */
export const ratio = (num, den) => (den > 0 ? (num / den) * 100 : 0);

/**
 * 고유 행 ID 생성 (crypto.randomUUID 우선, 폴백 포함)
 */
export const createRowId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `row_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};
