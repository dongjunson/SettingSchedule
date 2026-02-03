// zustand를 사용한 상태 관리 및 API 연동

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createSiteOnServer,
  deleteSiteOnServer,
  fetchAllSitesData,
  fetchSiteTimelineData,
  repairSiteTimelineOnServer,
  updateChecklistItemOnServer,
  updateSiteOnServer,
  updateTimelineItemOnServer,
} from './api';
import { hasSupabaseEnv, STATUS, STORAGE_KEYS } from './constants';
import {
  getNewSiteChecklistTemplate,
  getNewSiteTimelineTemplate,
  normalizeNewSiteTimelineForDb,
} from './siteTemplates';

// 초기 타임라인 데이터 - siteTemplates.js를 단일 소스로 사용
const getInitialTimeline = () =>
  getNewSiteTimelineTemplate().map((item, idx) => ({
    id: idx + 1,
    ...item,
  }));

// 초기 체크리스트 데이터 - siteTemplates.js를 단일 소스로 사용
const getInitialChecklist = () =>
  getNewSiteChecklistTemplate().map((item, idx) => ({
    id: idx + 1,
    ...item,
    // 기존 초기 데이터에서 일부 항목은 checked: true였으나,
    // 신규 사업소 템플릿은 모두 false로 시작하므로 그대로 사용
  }));

// 100% 완료된 타임라인 데이터 생성
const getCompletedTimeline = () => {
  return getInitialTimeline().map((item) => ({
    ...item,
    status: STATUS.COMPLETED,
    completedAt: item.completedAt || '2025-12-15T10:00:00Z',
  }));
};

// 100% 완료된 체크리스트 데이터 생성
const getCompletedChecklist = () => {
  return getInitialChecklist().map((item) => ({
    ...item,
    checked: true,
  }));
};

// 초기 데이터 구조
const getInitialData = () => ({
  sites: [
    {
      id: 'anyang-bakdal',
      name: '안양 박달 사업소',
      timeline: getInitialTimeline(),
      checklist: getInitialChecklist(),
    },
    {
      id: 'icheon-public-sewer',
      name: '이천 공공 하수도 사업소',
      timeline: getCompletedTimeline(),
      checklist: getCompletedChecklist(),
    },
    {
      id: 'gunpo-sewer',
      name: '군포 하수도 사업소',
      timeline: getInitialTimeline(),
      checklist: getInitialChecklist(),
    },
    {
      id: 'suwon',
      name: '수원 하수도 사업소',
      timeline: getInitialTimeline(),
      checklist: getInitialChecklist(),
    },
  ],
});

// 체크리스트 검증 및 업데이트 헬퍼 함수
// - Supabase 사용 시 checklist_items.id는 글로벌 PK(IDENTITY)라서 1~19를 보장하지 않습니다.
// - 따라서 "id 범위" 기반 필터링은 제거하고, 기본 체크리스트 텍스트 순서로만 정렬/보정합니다.
const validateAndUpdateChecklist = (checklist) => {
  if (!Array.isArray(checklist) || checklist.length === 0) {
    return getInitialChecklist();
  }

  // 기본형 보정 (최소 필드 보장)
  const normalized = checklist
    .filter((item) => item && item.id != null && typeof item.text === 'string')
    .map((item) => ({
      ...item,
      checked: Boolean(item.checked),
    }));

  if (normalized.length === 0) {
    return getInitialChecklist();
  }

  // 기본 체크리스트 텍스트 순서를 기준으로 정렬 (일관된 표시/엑셀 출력용)
  const base = getInitialChecklist();
  const orderMap = new Map(base.map((b, idx) => [b.text, idx]));
  normalized.sort(
    (a, b) =>
      (orderMap.get(a.text) ?? Number.POSITIVE_INFINITY) -
      (orderMap.get(b.text) ?? Number.POSITIVE_INFINITY)
  );

  return normalized;
};

// zustand 스토어 생성
export const useStore = create(
  persist(
    (set, get) => ({
      // 상태
      // Supabase 환경에서는 DB가 단일 소스 of truth. 초기 mock 데이터를 섞지 않습니다.
      sites: hasSupabaseEnv ? [] : getInitialData().sites,
      loading: false,
      error: null,

      // 모든 사업소 데이터 로드 (API에서)
      loadAllSites: async (forceRefresh = true) => {
        set({ loading: true, error: null });
        try {
          const data = await fetchAllSitesData();

          let sites = [];

          // API 응답이 { sites: [...] } 형태인지 확인
          if (data?.sites && Array.isArray(data.sites)) {
            sites = data.sites;
          } else if (Array.isArray(data)) {
            sites = data;
          } else {
            throw new Error('Invalid API response format');
          }

          // 체크리스트 검증 및 업데이트
          sites = sites.map((site) => ({
            ...site,
            checklist: validateAndUpdateChecklist(site.checklist),
          }));

          // Supabase 환경에서는 DB 데이터만 사용 (초기 mock 섞지 않음)
          const mergedSites = hasSupabaseEnv
            ? sites
            : (() => {
                const initialData = getInitialData();
                const initialSiteIds = new Set(sites.map((s) => s.id));
                const missingInitialSites = initialData.sites.filter(
                  (s) => !initialSiteIds.has(s.id)
                );
                return [...sites, ...missingInitialSites];
              })();

          set({ sites: mergedSites, loading: false });
          return { sites: mergedSites };
        } catch (error) {
          console.error('Failed to load data from API:', error);
          // Supabase 환경에서는 API 실패 시 fallback을 최소화 (빈 상태 유지)
          if (hasSupabaseEnv) {
            set({ sites: [], loading: false, error: error?.message || String(error) });
            return { sites: [] };
          }

          // API 실패 시 초기 데이터 사용 (새로 추가한 프로젝트 포함)
          const initialData = getInitialData();
          // 기존 캐시된 데이터와 초기 데이터를 병합 (초기 데이터 우선)
          const cachedSites = get().sites;
          if (cachedSites && cachedSites.length > 0) {
            // 초기 데이터의 프로젝트 ID 목록
            const initialSiteIds = new Set(initialData.sites.map((s) => s.id));
            // 캐시된 데이터 중 초기 데이터에 없는 프로젝트는 유지
            const mergedSites = [
              ...initialData.sites,
              ...cachedSites.filter((s) => !initialSiteIds.has(s.id)),
            ];
            set({ sites: mergedSites, loading: false, error: null });
            return { sites: mergedSites };
          }
          // 캐시도 없으면 초기 데이터 반환
          set({ sites: initialData.sites, loading: false, error: null });
          return initialData;
        }
      },

      // 특정 사업소 데이터 로드 (API에서)
      loadSite: async (siteId, forceRefresh = true) => {
        set({ loading: true, error: null });
        try {
          const siteData = await fetchSiteTimelineData(siteId);

          let site = null;

          // API 응답이 직접 사이트 객체인 경우
          if (siteData?.id) {
            site = siteData;
          } else if (siteData?.site) {
            site = siteData.site;
          } else {
            throw new Error('Invalid API response format');
          }

          // 체크리스트 검증
          site.checklist = validateAndUpdateChecklist(site.checklist);

          // 스토어에 업데이트
          const currentSites = get().sites;
          const siteIndex = currentSites.findIndex((s) => s.id === siteId);

          if (siteIndex !== -1) {
            set({
              sites: currentSites.map((s, idx) => (idx === siteIndex ? site : s)),
              loading: false,
            });
          } else {
            set({
              sites: [...currentSites, site],
              loading: false,
            });
          }

          return site;
        } catch (error) {
          console.error('Failed to fetch site data from API:', error);
          if (hasSupabaseEnv) {
            set({ loading: false, error: error?.message || String(error) });
            throw error;
          }
          // API 실패 시에만 캐시에서 가져오기
          const cachedSite = get().sites.find((s) => s.id === siteId);
          if (cachedSite) {
            set({ loading: false, error: null });
            return cachedSite;
          }
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // 타임라인 항목 업데이트
      updateTimelineItem: async (siteId, itemId, updates) => {
        const currentSites = get().sites;
        const site = currentSites.find((s) => s.id === siteId);

        if (!site) {
          console.error('Site not found:', siteId);
          return null;
        }

        const itemIndex = site.timeline.findIndex((item) => String(item.id) === String(itemId));
        if (itemIndex === -1) {
          console.error('Timeline item not found:', itemId);
          return null;
        }

        // 로컬 상태 먼저 업데이트 (낙관적 업데이트)
        const updatedTimeline = [...site.timeline];
        updatedTimeline[itemIndex] = { ...updatedTimeline[itemIndex], ...updates };

        const updatedSite = {
          ...site,
          timeline: updatedTimeline,
        };

        const updatedSites = currentSites.map((s) => (s.id === siteId ? updatedSite : s));
        set({ sites: updatedSites });

        // 서버에 업데이트 시도 (실패해도 로컬 상태는 유지)
        try {
          const serverItem = await updateTimelineItemOnServer(siteId, itemId, updates);
          // Supabase 환경에서는 서버가 정답이므로, 업데이트된 row를 받아서 해당 아이템만 교체합니다.
          if (hasSupabaseEnv && serverItem) {
            const refreshedSites = get().sites.map((s) => {
              if (s.id !== siteId) return s;
              return {
                ...s,
                timeline: s.timeline.map((it) =>
                  String(it.id) === String(itemId) ? serverItem : it
                ),
              };
            });
            set({ sites: refreshedSites });
          }
        } catch (error) {
          console.error('Failed to update timeline item on server:', error);
          set({ error: error?.message || String(error) });
          // 서버 업데이트 실패 시에도 로컬 상태는 유지
        }

        return updatedTimeline[itemIndex];
      },

      // 체크리스트 항목 업데이트
      updateChecklistItem: async (siteId, itemId, checked) => {
        const currentSites = get().sites;
        const site = currentSites.find((s) => s.id === siteId);

        if (!site) {
          console.error('Site not found:', siteId);
          return null;
        }

        const itemIndex = site.checklist.findIndex((item) => String(item.id) === String(itemId));
        if (itemIndex === -1) {
          console.error('Checklist item not found:', itemId);
          return null;
        }

        // 로컬 상태 먼저 업데이트 (낙관적 업데이트)
        const updatedChecklist = [...site.checklist];
        updatedChecklist[itemIndex] = { ...updatedChecklist[itemIndex], checked };

        const updatedSite = {
          ...site,
          checklist: updatedChecklist,
        };

        const updatedSites = currentSites.map((s) => (s.id === siteId ? updatedSite : s));
        set({ sites: updatedSites });

        // 서버에 업데이트 시도 (실패해도 로컬 상태는 유지)
        try {
          const serverItem = await updateChecklistItemOnServer(siteId, itemId, checked);
          if (hasSupabaseEnv && serverItem) {
            const refreshedSites = get().sites.map((s) => {
              if (s.id !== siteId) return s;
              return {
                ...s,
                checklist: s.checklist.map((it) =>
                  String(it.id) === String(itemId) ? serverItem : it
                ),
              };
            });
            set({ sites: refreshedSites });
          }
        } catch (error) {
          console.error('Failed to update checklist item on server:', error);
          set({ error: error?.message || String(error) });
          // 서버 업데이트 실패 시에도 로컬 상태는 유지
        }

        return updatedChecklist[itemIndex];
      },

      // 진행도 계산
      calculateProgress: (siteId) => {
        const site = get().sites.find((s) => s.id === siteId);
        if (!site) return { timeline: 0, checklist: 0, overall: 0, working: 0, completed: 0 };

        // 타임라인 진행도 (completed만 100%로 계산, working은 표시만)
        const timelineTotal = site.timeline.length;
        const timelineCompleted = site.timeline.filter(
          (item) => item.status === STATUS.COMPLETED
        ).length;
        const timelineWorking = site.timeline.filter(
          (item) => item.status === STATUS.WORKING
        ).length;
        // 완료된 항목만 진행도에 포함
        const timelineProgress = timelineTotal > 0 ? (timelineCompleted / timelineTotal) * 100 : 0;

        // 체크리스트 진행도
        const checklistTotal = site.checklist.length;
        const checklistCompleted = site.checklist.filter((item) => item.checked).length;
        const checklistProgress =
          checklistTotal > 0 ? (checklistCompleted / checklistTotal) * 100 : 0;

        // 전체 진행도 (타임라인 70%, 체크리스트 30%)
        const overallProgress = timelineProgress * 0.7 + checklistProgress * 0.3;

        return {
          timeline: Math.round(timelineProgress),
          checklist: Math.round(checklistProgress),
          overall: Math.round(overallProgress),
          // 추가 정보: 완료 및 진행중 개수 (차트 표시용)
          working: timelineWorking,
          completed: timelineCompleted,
          total: timelineTotal,
        };
      },

      // 사업소 데이터 가져오기 (동기)
      getSite: (siteId) => {
        return get().sites.find((site) => site.id === siteId) || null;
      },

      // 신규 사업소 생성 (admin 전용 UI에서 호출)
      createSite: async ({ name }) => {
        if (!hasSupabaseEnv) {
          throw new Error('Supabase 환경변수가 설정되지 않아 DB에 사업소를 추가할 수 없습니다.');
        }
        const siteName = (name || '').toString().trim();
        if (!siteName) throw new Error('사업소 이름을 입력해주세요.');

        // 한글/공백 등에서도 안전한 id 생성 (중복 방지)
        const slug = siteName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        const siteId = slug && slug !== '-' ? slug : `site-${Date.now()}`;

        const created = await createSiteOnServer({
          id: siteId,
          name: siteName,
          timelineItems: normalizeNewSiteTimelineForDb(getNewSiteTimelineTemplate()),
          checklistItems: getNewSiteChecklistTemplate(),
        });

        // 로컬 상태에 반영
        const currentSites = get().sites;
        set({ sites: [...currentSites.filter((s) => s.id !== created.id), created] });
        return created;
      },

      deleteSite: async (siteId) => {
        if (!hasSupabaseEnv) {
          throw new Error('Supabase 환경변수가 설정되지 않아 DB에서 사업소를 삭제할 수 없습니다.');
        }
        const id = (siteId || '').toString().trim();
        if (!id) throw new Error('삭제할 사업소 id가 올바르지 않습니다.');

        await deleteSiteOnServer(id);
        set({ sites: get().sites.filter((s) => s.id !== id) });
        return { ok: true };
      },

      // 사업소명 수정 (admin 전용)
      updateSite: async (siteId, updates) => {
        if (!hasSupabaseEnv) {
          throw new Error('Supabase 환경변수가 설정되지 않아 DB를 수정할 수 없습니다.');
        }
        const id = (siteId || '').toString().trim();
        if (!id) throw new Error('사업소 id가 올바르지 않습니다.');

        const result = await updateSiteOnServer(id, updates);
        if (result) {
          set({
            sites: get().sites.map((s) => (s.id === id ? { ...s, name: result.name } : s)),
          });
        }
        return result;
      },

      // (admin 도구) 특정 사업소의 타임라인 누락 step을 템플릿 기준으로 보정
      repairSiteTimeline: async (siteId) => {
        if (!hasSupabaseEnv) {
          throw new Error('Supabase 환경변수가 설정되지 않아 DB를 보정할 수 없습니다.');
        }
        const id = (siteId || '').toString().trim();
        if (!id) throw new Error('사업소 id가 올바르지 않습니다.');

        const { inserted } = await repairSiteTimelineOnServer(
          id,
          normalizeNewSiteTimelineForDb(getNewSiteTimelineTemplate())
        );

        // 최신 데이터로 재로드
        await get().loadSite(id, true);
        return { inserted };
      },
    }),
    {
      name: STORAGE_KEYS.SITE_TIMELINE,
      // persist 옵션: sites만 저장
      partialize: (state) => ({ sites: state.sites }),
      // localStorage에서 복원할 때 초기 데이터의 프로젝트들이 항상 포함되도록 함
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (hasSupabaseEnv) return;
          const initialData = getInitialData();
          const initialSiteIds = new Set(state.sites.map((s) => s.id));
          const missingInitialSites = initialData.sites.filter((s) => !initialSiteIds.has(s.id));
          if (missingInitialSites.length > 0) {
            state.sites = [...state.sites, ...missingInitialSites];
          }
        }
      },
    }
  )
);
