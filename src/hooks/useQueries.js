import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSiteOnServer,
  deleteSiteOnServer,
  fetchAllSitesData,
  fetchSiteTimelineData,
  repairSiteTimelineOnServer,
  updateChecklistItemOnServer,
  updateSiteOnServer,
  updateTimelineItemOnServer,
} from '../lib/api';
import { STATUS } from '../lib/constants';
import {
  getNewSiteChecklistTemplate,
  getNewSiteTimelineTemplate,
  normalizeNewSiteTimelineForDb,
} from '../lib/siteTemplates';

export const calculateSiteProgress = (site) => {
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

  const overallProgress = timelineProgress * 0.7 + checklistProgress * 0.3;

  return {
    timeline: Math.round(timelineProgress),
    checklist: Math.round(checklistProgress),
    overall: Math.round(overallProgress),
    working: timelineWorking,
    completed: timelineCompleted,
    total: timelineTotal,
  };
};

const validateAndUpdateChecklist = (checklist) => {
  const initialChecklist = getNewSiteChecklistTemplate().map((item, idx) => ({
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

export const useSites = () => {
  return useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      try {
        const data = await fetchAllSitesData();
        let sites = [];

        if (data?.sites && Array.isArray(data.sites)) {
          sites = data.sites;
        } else if (Array.isArray(data)) {
          sites = data;
        } else {
          sites = [];
        }

        const withChecklist = sites.map((site) => ({
          ...site,
          checklist: validateAndUpdateChecklist(site.checklist),
        }));

        // 최근 생성 순 정렬 (createdAt 없으면 뒤로)
        withChecklist.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });

        return withChecklist;
      } catch (error) {
        console.error('Failed to fetch sites:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    gcTime: 1000 * 60 * 30, // 30분간 캐시 유지 (메모리 캐시는 새로고침 시 사라지지만, 설정은 명시)
    refetchOnMount: false, // staleTime 내에서는 자동으로 false이지만 명시
    refetchOnWindowFocus: false, // 창 포커스 시 refetch 방지
  });
};

export const useSite = (siteId) => {
  return useQuery({
    queryKey: ['site', siteId],
    queryFn: async () => {
      if (!siteId) {
        throw new Error('Site ID is required');
      }

      try {
        const siteData = await fetchSiteTimelineData(siteId);
        let site = null;

        if (siteData?.id) {
          site = siteData;
        } else if (siteData?.site) {
          site = siteData.site;
        } else {
          throw new Error('Invalid API response format');
        }

        site.checklist = validateAndUpdateChecklist(site.checklist);
        return site;
      } catch (error) {
        console.error(`Failed to fetch site ${siteId}:`, error);
        throw error;
      }
    },
    enabled: !!siteId,
  });
};

export const useCreateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }) => {
      // 사업소 이름에서 id 자동 생성
      const siteName = (name || '').toString().trim();
      if (!siteName) {
        throw new Error('사업소 이름을 입력해주세요.');
      }

      // 한글/공백 등에서도 안전한 id 생성 (중복 방지)
      const slug = siteName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const siteId = slug && slug !== '-' ? slug : `site-${Date.now()}`;

      // 타임라인과 체크리스트 템플릿 준비
      const timelineItems = normalizeNewSiteTimelineForDb(getNewSiteTimelineTemplate());
      const checklistItems = getNewSiteChecklistTemplate();

      return createSiteOnServer({
        id: siteId,
        name: siteName,
        timelineItems,
        checklistItems,
      });
    },
    onSuccess: (newSite) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.refetchQueries({ queryKey: ['sites'] });
      if (newSite) {
        queryClient.setQueryData(['site', newSite.id], newSite);
      }
    },
  });
};

export const useDeleteSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSiteOnServer,
    onSuccess: (_, deletedSiteId) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.removeQueries({ queryKey: ['site', deletedSiteId] });
    },
  });
};

export const useUpdateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ siteId, updates }) => updateSiteOnServer(siteId, updates),
    onSuccess: (updatedSite, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      if (updatedSite) {
        queryClient.setQueryData(['site', siteId], (old) => {
          if (!old) return old;
          return { ...old, ...updatedSite };
        });
      }
    },
  });
};

export const useUpdateTimelineItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ siteId, itemId, updates }) =>
      updateTimelineItemOnServer(siteId, itemId, updates),
    onMutate: async ({ siteId, itemId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['site', siteId] });

      const previousSite = queryClient.getQueryData(['site', siteId]);

      if (previousSite) {
        queryClient.setQueryData(['site', siteId], (old) => {
          if (!old) return old;
          return {
            ...old,
            timeline: old.timeline.map((item) =>
              String(item.id) === String(itemId) ? { ...item, ...updates } : item
            ),
          };
        });
      }

      return { previousSite };
    },
    onError: (err, variables, context) => {
      if (context?.previousSite) {
        queryClient.setQueryData(['site', variables.siteId], context.previousSite);
      }
    },
    onSettled: (data, error, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      // 사업소 목록도 즉시 refetch하여 진행도 업데이트
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.refetchQueries({ queryKey: ['sites'] });
    },
  });
};

export const useUpdateChecklistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ siteId, itemId, checked }) =>
      updateChecklistItemOnServer(siteId, itemId, checked),
    onMutate: async ({ siteId, itemId, checked }) => {
      await queryClient.cancelQueries({ queryKey: ['site', siteId] });
      const previousSite = queryClient.getQueryData(['site', siteId]);

      if (previousSite) {
        queryClient.setQueryData(['site', siteId], (old) => {
          if (!old) return old;
          return {
            ...old,
            checklist: old.checklist.map((item) =>
              String(item.id) === String(itemId) ? { ...item, checked } : item
            ),
          };
        });
      }
      return { previousSite };
    },
    onError: (err, variables, context) => {
      if (context?.previousSite) {
        queryClient.setQueryData(['site', variables.siteId], context.previousSite);
      }
    },
    onSettled: (data, error, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      // 사업소 목록도 즉시 refetch하여 진행도 업데이트
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.refetchQueries({ queryKey: ['sites'] });
    },
  });
};

export const useRepairSiteTimeline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (siteId) => {
      if (!siteId) {
        throw new Error('Site ID is required');
      }
      return repairSiteTimelineOnServer(
        siteId,
        normalizeNewSiteTimelineForDb(getNewSiteTimelineTemplate())
      );
    },
    onSuccess: (_, siteId) => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
};
