// React Query 키를 중앙에서 관리합니다.
// 모든 query/mutation에서 이 상수를 사용하여 일관성을 유지합니다.

export const queryKeys = {
  sites: ['sites'],
  site: (siteId) => ['site', siteId],
  incomeStatement: (siteId) => ['incomeStatement', siteId],
};
