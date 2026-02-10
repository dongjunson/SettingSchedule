import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSiteOnServer,
  deleteSiteOnServer,
  fetchAllSitesData,
  fetchIncomeStatement,
  fetchSiteById,
  fetchSiteTimelineData,
  repairSiteTimelineOnServer,
  updateChecklistItemOnServer,
  updateSiteOnServer,
  updateTimelineItemOnServer,
  upsertIncomeStatement,
} from '../lib/api';
import { buildDefaultExpenseItems, buildDefaultSalesItems } from '../lib/incomeConstants';
import { createRowId, toNumber } from '../lib/numberUtils';
import { queryKeys } from '../lib/queryKeys';
import {
  getNewSiteChecklistTemplate,
  getNewSiteTimelineTemplate,
  normalizeNewSiteTimelineForDb,
} from '../lib/siteTemplates';
import { calculateSiteProgress, validateAndUpdateChecklist } from '../lib/utils';

// re-export for backward compatibility
export { calculateSiteProgress };

// ─── 사이트 목록 ───────────────────────────────

export const useSites = () => {
  return useQuery({
    queryKey: queryKeys.sites,
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
          checklist: validateAndUpdateChecklist(site.checklist, getNewSiteChecklistTemplate),
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
    gcTime: 1000 * 60 * 30,
    // refetchOnMount: 기본값(true) 사용
    // → staleTime 내에서는 캐시 사용, invalidation 후에는 마운트 시 자동 refetch
    refetchOnWindowFocus: false,
  });
};

// ─── 개별 사이트 ───────────────────────────────

export const useSite = (siteId) => {
  return useQuery({
    queryKey: queryKeys.site(siteId),
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

        site.checklist = validateAndUpdateChecklist(site.checklist, getNewSiteChecklistTemplate);
        return site;
      } catch (error) {
        console.error(`Failed to fetch site ${siteId}:`, error);
        throw error;
      }
    },
    enabled: !!siteId,
  });
};

// ─── 사이트 생성 ───────────────────────────────

export const useCreateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }) => {
      const siteName = (name || '').toString().trim();
      if (!siteName) {
        throw new Error('사업소 이름을 입력해주세요.');
      }

      const slug = siteName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const siteId = slug && slug !== '-' ? slug : `site-${Date.now()}`;

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
      queryClient.invalidateQueries({ queryKey: queryKeys.sites });
      if (newSite) {
        queryClient.setQueryData(queryKeys.site(newSite.id), newSite);
      }
    },
  });
};

// ─── 사이트 삭제 ───────────────────────────────

export const useDeleteSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSiteOnServer,
    onSuccess: (_, deletedSiteId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites });
      queryClient.removeQueries({ queryKey: queryKeys.site(deletedSiteId) });
    },
  });
};

// ─── 사이트 수정 ───────────────────────────────

export const useUpdateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ siteId, updates }) => updateSiteOnServer(siteId, updates),
    onSuccess: (updatedSite, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites });
      if (updatedSite) {
        queryClient.setQueryData(queryKeys.site(siteId), (old) => {
          if (!old) return old;
          return { ...old, ...updatedSite };
        });
      }
    },
  });
};

// ─── 타임라인 항목 업데이트 ───────────────────

export const useUpdateTimelineItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ siteId, itemId, updates }) =>
      updateTimelineItemOnServer(siteId, itemId, updates),
    onMutate: async ({ siteId, itemId, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.site(siteId) });

      const previousSite = queryClient.getQueryData(queryKeys.site(siteId));

      if (previousSite) {
        queryClient.setQueryData(queryKeys.site(siteId), (old) => {
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
        queryClient.setQueryData(queryKeys.site(variables.siteId), context.previousSite);
      }
    },
    onSettled: (data, error, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.site(siteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sites });
    },
  });
};

// ─── 체크리스트 항목 업데이트 ─────────────────

export const useUpdateChecklistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ siteId, itemId, checked }) =>
      updateChecklistItemOnServer(siteId, itemId, checked),
    onMutate: async ({ siteId, itemId, checked }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.site(siteId) });
      const previousSite = queryClient.getQueryData(queryKeys.site(siteId));

      if (previousSite) {
        queryClient.setQueryData(queryKeys.site(siteId), (old) => {
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
        queryClient.setQueryData(queryKeys.site(variables.siteId), context.previousSite);
      }
    },
    onSettled: (data, error, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.site(siteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sites });
    },
  });
};

// ─── 타임라인 복구 ────────────────────────────

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
      queryClient.invalidateQueries({ queryKey: queryKeys.site(siteId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sites });
    },
  });
};

// ─── 손익계산서 데이터 조회 ───────────────────

export const useIncomeStatement = (siteId) => {
  return useQuery({
    queryKey: queryKeys.incomeStatement(siteId),
    queryFn: async () => {
      if (!siteId) throw new Error('Site ID is required');

      const [siteData, incomeData] = await Promise.all([
        fetchSiteById(siteId),
        fetchIncomeStatement(siteId),
      ]);

      const siteName = siteData?.name ?? siteId;

      if (!incomeData) {
        return {
          siteName,
          header: { expectedAmount: '', contractAmount: '' },
          salesItems: buildDefaultSalesItems(),
          expenseItems: buildDefaultExpenseItems(),
        };
      }

      const header = {
        expectedAmount: incomeData.expectedAmount ? incomeData.expectedAmount.toString() : '',
        contractAmount: incomeData.contractAmount ? incomeData.contractAmount.toString() : '',
      };

      const items = (incomeData.items || [])
        .map((item) => ({
          id: item.id ?? createRowId(),
          type: item.type,
          groupName: item.groupName ?? null,
          category: item.category ?? null,
          name: item.name ?? '',
          amount: item.amount ? String(item.amount) : '',
          note: item.note ?? '',
          paymentType: item.paymentType ?? '',
          spentAt: item.spentAt ?? '',
          description: item.description ?? '',
          orderIndex: item.orderIndex ?? 0,
        }))
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

      const loadedSales = items.filter((item) => item.type === 'sales');
      const loadedExpense = items.filter((item) => item.type === 'expense');

      return {
        siteName,
        header,
        salesItems: loadedSales.length > 0 ? loadedSales : buildDefaultSalesItems(),
        expenseItems: loadedExpense.length > 0 ? loadedExpense : buildDefaultExpenseItems(),
      };
    },
    enabled: !!siteId,
  });
};

// ─── 손익계산서 저장 ──────────────────────────

export const useUpsertIncomeStatement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ siteId, header, salesItems, expenseItems }) => {
      const items = [...salesItems, ...expenseItems]
        .filter(
          (item) =>
            item.name ||
            item.amount ||
            item.note ||
            item.description ||
            item.paymentType ||
            item.spentAt
        )
        .map((item, index) => ({
          type: item.type,
          groupName: item.groupName,
          category: item.category,
          name: item.name,
          amount: toNumber(item.amount),
          note: item.note,
          paymentType: item.paymentType,
          spentAt: item.spentAt,
          description: item.description,
          orderIndex: index,
        }));

      return upsertIncomeStatement(
        siteId,
        {
          expectedAmount: header.expectedAmount ? toNumber(header.expectedAmount) : null,
          contractAmount: header.contractAmount ? toNumber(header.contractAmount) : null,
        },
        items
      );
    },
    onSuccess: (_, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incomeStatement(siteId) });
    },
  });
};
