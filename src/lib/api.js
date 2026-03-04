import axios from 'axios';
import { API_CONFIG, ERROR_MESSAGES, STATUS, hasSupabaseEnv } from './constants';
import { supabase } from './supabase';

// axios 인스턴스 생성 (Supabase 미설정 시 fallback)
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

const mapTimelineRowToItem = (row) => ({
  // bigint identity can overflow JS number precision; keep as string
  id: String(row.id),
  siteId: row.site_id ?? null,
  step: row.step ?? '',
  task: row.task ?? '',
  section: row.section ?? '',
  subsection: row.subsection ?? null,
  status: row.status ?? STATUS.PENDING,
  // Supabase schema uses snake_case; UI uses camelCase
  startDate: row.start_date ?? null,
  completionDate: row.completion_date ?? null,
  // Optional (not in documented schema, but UI supports it)
  completedAt: row.completed_at ?? null,
  completedBy: row.completed_by ?? null,
});

const mapChecklistRowToItem = (row) => ({
  // bigint identity can overflow JS number precision; keep as string
  id: String(row.id),
  siteId: row.site_id ?? null,
  text: row.text ?? '',
  checked: Boolean(row.checked),
});

const mapIncomeStatementRow = (row) => ({
  // bigint identity can overflow JS number precision; keep as string
  id: String(row.id),
  siteId: row.site_id ?? null,
  expectedAmount: row.expected_amount ?? null,
  contractAmount: row.contract_amount ?? null,
  createdAt: row.created_at ?? null,
  updatedAt: row.updated_at ?? null,
});

const mapIncomeStatementItemRow = (row) => ({
  // bigint identity can overflow JS number precision; keep as string
  id: String(row.id),
  statementId: row.statement_id ?? null,
  type: row.type ?? 'sales',
  groupName: row.group_name ?? null,
  category: row.category ?? null,
  name: row.name ?? '',
  amount: row.amount ?? 0,
  note: row.note ?? '',
  paymentType: row.payment_type ?? null,
  spentAt: row.spent_at ?? null,
  description: row.description ?? null,
  orderIndex: row.order_index ?? 0,
  createdAt: row.created_at ?? null,
});

const mapSiteRowToSite = (row) => ({
  id: row.id,
  name: row.name,
  stage: row.stage ?? null,
  siteUrl: row.site_url ?? null,
  createdAt: row.created_at ?? null,
  timeline: Array.isArray(row.timeline_items) ? row.timeline_items.map(mapTimelineRowToItem) : [],
  checklist: Array.isArray(row.checklist_items)
    ? row.checklist_items.map(mapChecklistRowToItem)
    : [],
});

// 사업소 기본 정보만 가져오기
export const fetchSiteById = async (siteId) => {
  if (hasSupabaseEnv) {
    const { data, error } = await supabase
      .from('sites')
      .select('id, name, stage, created_at')
      .eq('id', siteId)
      .single();

    if (error) {
      console.error('Supabase fetchSiteById error:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      stage: data.stage ?? null,
      createdAt: data.created_at ?? null,
    };
  }

  // fallback REST API
  try {
    const response = await api.get(`/sites/${siteId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch site:', error);
    throw error;
  }
};

// 사업소 타임라인/체크리스트 데이터 가져오기
export const fetchSiteTimelineData = async (siteId) => {
  if (hasSupabaseEnv) {
    const { data, error } = await supabase
      .from('sites')
      .select('*, timeline_items(*), checklist_items(*)')
      .eq('id', siteId)
      .single();

    if (error) {
      console.error('Supabase fetchSiteTimelineData error:', error);
      throw error;
    }

    return mapSiteRowToSite(data);
  }

  // fallback REST API
  try {
    const response = await api.get(`/sites/${siteId}/timeline`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch timeline data:', error);
    throw error;
  }
};

// 모든 사업소 데이터 가져오기
export const fetchAllSitesData = async () => {
  if (hasSupabaseEnv) {
    const { data, error } = await supabase
      .from('sites')
      .select('*, timeline_items(*), checklist_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetchAllSitesData error:', error);
      throw error;
    }

    return { sites: Array.isArray(data) ? data.map(mapSiteRowToSite) : [] };
  }

  // fallback REST API
  try {
    const response = await api.get('/sites');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch sites data:', error);
    throw error;
  }
};

const toSnakeCaseTimelineUpdates = (updates) => {
  const out = {};
  if ('status' in updates) out.status = updates.status;
  if ('startDate' in updates) out.start_date = updates.startDate;
  if ('completionDate' in updates) out.completion_date = updates.completionDate;
  if ('completedAt' in updates) out.completed_at = updates.completedAt;
  if ('completedBy' in updates) out.completed_by = updates.completedBy;
  return out;
};

// 타임라인 항목 업데이트 (서버에 저장)
export const updateTimelineItemOnServer = async (siteId, itemId, updates) => {
  if (hasSupabaseEnv) {
    const payload = toSnakeCaseTimelineUpdates(updates ?? {});
    if (Object.keys(payload).length === 0) return null;

    const idForQuery = String(itemId);
    const { data, error } = await supabase
      .from('timeline_items')
      .update(payload)
      .eq('id', idForQuery)
      .eq('site_id', siteId)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase updateTimelineItemOnServer error:', error);
      throw error;
    }

    return mapTimelineRowToItem(data);
  }

  // fallback REST API
  try {
    const response = await api.patch(`/sites/${siteId}/timeline/${itemId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Failed to update timeline item on server:', error);
    throw error;
  }
};

// 체크리스트 항목 업데이트 (서버에 저장)
export const updateChecklistItemOnServer = async (siteId, itemId, checked) => {
  if (hasSupabaseEnv) {
    // checklist_items는 id만으로도 충분하지만, 안전하게 site_id 조건도 포함합니다.
    const idForQuery = String(itemId);
    const { data, error } = await supabase
      .from('checklist_items')
      .update({ checked: Boolean(checked) })
      .eq('id', idForQuery)
      .eq('site_id', siteId)
      .select('*');
    if (error) {
      console.error('Supabase updateChecklistItemOnServer error:', error);
      throw error;
    }
    return Array.isArray(data) && data[0] ? mapChecklistRowToItem(data[0]) : null;
  }

  // fallback REST API
  try {
    const response = await api.patch(`/sites/${siteId}/checklist/${itemId}`, { checked });
    return response.data;
  } catch (error) {
    console.error('Failed to update checklist item on server:', error);
    throw error;
  }
};

export const createSiteOnServer = async ({ id, name, timelineItems = [], checklistItems = [] }) => {
  if (!hasSupabaseEnv) {
    throw new Error('Supabase environment variables are missing.');
  }

  const siteId = (id || '').toString().trim();
  const siteName = (name || '').toString().trim();
  if (!siteId || !siteName) {
    throw new Error('Site id and name are required.');
  }

  // 1) Create site (stage = null → not shown on "구축중 프로젝트" list)
  const { error: siteError } = await supabase
    .from('sites')
    .insert({ id: siteId, name: siteName, stage: null });
  if (siteError) {
    console.error('Supabase createSiteOnServer(site) error:', siteError);
    throw siteError;
  }

  // 2) Seed timeline/checklist (optional)
  if (timelineItems.length > 0) {
    const payload = timelineItems.map((item) => ({
      site_id: siteId,
      step: item.step ?? '',
      task: item.task ?? '',
      section: item.section ?? '',
      subsection: item.subsection ?? null,
      status: item.status ?? STATUS.PENDING,
      start_date: item.startDate ?? null,
      completion_date: item.completionDate ?? null,
      completed_at: item.completedAt ?? null,
      completed_by: item.completedBy ?? null,
    }));
    const { error: tlError } = await supabase.from('timeline_items').insert(payload);
    if (tlError) {
      console.error('Supabase createSiteOnServer(timeline_items) error:', tlError);
      throw tlError;
    }
  }

  if (checklistItems.length > 0) {
    const payload = checklistItems.map((item) => ({
      site_id: siteId,
      text: item.text ?? '',
      checked: Boolean(item.checked),
    }));
    const { error: clError } = await supabase.from('checklist_items').insert(payload);
    if (clError) {
      console.error('Supabase createSiteOnServer(checklist_items) error:', clError);
      throw clError;
    }
  }

  // Return freshly created site (with nested items)
  return await fetchSiteTimelineData(siteId);
};

export const deleteSiteOnServer = async (siteId) => {
  if (!hasSupabaseEnv) {
    throw new Error('Supabase environment variables are missing.');
  }

  const id = (siteId || '').toString().trim();
  if (!id) throw new Error('Site id is required.');

  // FK (timeline_items/checklist_items) is ON DELETE CASCADE
  const { error } = await supabase.from('sites').delete().eq('id', id);
  if (error) {
    console.error('Supabase deleteSiteOnServer error:', error);
    throw error;
  }
  return { ok: true };
};

export const updateSiteOnServer = async (siteId, updates) => {
  if (!hasSupabaseEnv) {
    throw new Error('Supabase environment variables are missing.');
  }

  const id = (siteId || '').toString().trim();
  if (!id) throw new Error('Site id is required.');

  const payload = {};
  if ('name' in updates && updates.name != null) {
    payload.name = updates.name.toString().trim();
  }
  if ('stage' in updates) {
    payload.stage = updates.stage == null ? null : String(updates.stage);
  }
  if ('siteUrl' in updates) {
    payload.site_url = updates.siteUrl == null || updates.siteUrl === '' ? null : String(updates.siteUrl).trim();
  }

  if (Object.keys(payload).length === 0) {
    return null;
  }

  const { data, error } = await supabase
    .from('sites')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Supabase updateSiteOnServer error:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    stage: data.stage ?? null,
    siteUrl: data.site_url ?? null,
  };
};

export const repairSiteTimelineOnServer = async (siteId, timelineTemplateItems) => {
  if (!hasSupabaseEnv) {
    throw new Error('Supabase environment variables are missing.');
  }
  const id = (siteId || '').toString().trim();
  if (!id) throw new Error('Site id is required.');

  const template = Array.isArray(timelineTemplateItems) ? timelineTemplateItems : [];
  if (template.length === 0) return { inserted: 0 };

  // 1) existing steps
  const { data: existing, error: selErr } = await supabase
    .from('timeline_items')
    .select('step')
    .eq('site_id', id);
  if (selErr) {
    console.error('Supabase repairSiteTimelineOnServer(select) error:', selErr);
    throw selErr;
  }

  const existingSteps = new Set((existing || []).map((r) => (r.step ?? '').toString().trim()));
  const missing = template.filter((t) => !existingSteps.has((t.step ?? '').toString().trim()));

  if (missing.length === 0) return { inserted: 0 };

  const payload = missing.map((item) => ({
    site_id: id,
    step: item.step ?? '',
    task: item.task ?? '',
    section: item.section ?? '',
    subsection: item.subsection ?? null,
    status: item.status ?? STATUS.PENDING,
    start_date: item.startDate ?? null,
    completion_date: item.completionDate ?? null,
    completed_at: item.completedAt ?? null,
    completed_by: item.completedBy ?? null,
  }));

  const { error: insErr } = await supabase.from('timeline_items').insert(payload);
  if (insErr) {
    console.error('Supabase repairSiteTimelineOnServer(insert) error:', insErr);
    throw insErr;
  }

  return { inserted: payload.length };
};

export const fetchIncomeStatement = async (siteId) => {
  if (!hasSupabaseEnv) {
    throw new Error('Supabase environment variables are missing.');
  }

  const id = (siteId || '').toString().trim();
  if (!id) throw new Error('Site id is required.');

  const { data, error } = await supabase
    .from('income_statements')
    .select('*, income_statement_items(*)')
    .eq('site_id', id)
    .maybeSingle();

  if (error) {
    console.error('Supabase fetchIncomeStatement error:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: String(data.id),
    siteId: data.site_id ?? null,
    expectedAmount: data.expected_amount ?? null,
    contractAmount: data.contract_amount ?? null,
    items: Array.isArray(data.income_statement_items)
      ? data.income_statement_items.map(mapIncomeStatementItemRow)
      : [],
  };
};

export const upsertIncomeStatement = async (siteId, header, items = []) => {
  if (!hasSupabaseEnv) {
    throw new Error('Supabase environment variables are missing.');
  }

  const id = (siteId || '').toString().trim();
  if (!id) throw new Error('Site id is required.');

  const payload = {
    site_id: id,
    expected_amount: header?.expectedAmount ?? null,
    contract_amount: header?.contractAmount ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data: statement, error: upsertError } = await supabase
    .from('income_statements')
    .upsert(payload, { onConflict: 'site_id' })
    .select('id')
    .single();

  if (upsertError) {
    console.error('Supabase upsertIncomeStatement error:', upsertError);
    throw upsertError;
  }

  const statementId = statement?.id;
  if (!statementId) {
    throw new Error('Failed to resolve income statement id.');
  }

  const { error: deleteError } = await supabase
    .from('income_statement_items')
    .delete()
    .eq('statement_id', statementId);

  if (deleteError) {
    console.error('Supabase upsertIncomeStatement(delete items) error:', deleteError);
    throw deleteError;
  }

  const normalizedItems = Array.isArray(items)
    ? items
        .filter((item) => {
          const hasCore =
            item?.name ||
            item?.description ||
            item?.note ||
            item?.amount ||
            item?.paymentType ||
            item?.spentAt;
          return Boolean(hasCore);
        })
        .map((item, index) => ({
          statement_id: statementId,
          type: item?.type ?? 'sales',
          group_name: item?.groupName ?? null,
          category: item?.category ?? null,
          name: item?.name ?? '',
          amount: item?.amount ?? 0,
          note: item?.note ?? '',
          payment_type: item?.paymentType || null,
          spent_at: item?.spentAt || null, // 빈 문자열은 null로 변환
          description: item?.description || null,
          order_index: item?.orderIndex ?? index,
        }))
    : [];

  if (normalizedItems.length > 0) {
    const { error: insertError } = await supabase
      .from('income_statement_items')
      .insert(normalizedItems);

    if (insertError) {
      console.error('Supabase upsertIncomeStatement(insert items) error:', insertError);
      throw insertError;
    }
  }

  return { ok: true, id: statementId };
};

/**
 * 관리자 전용: 이메일로 사용자 초대 (Supabase Auth 초대 메일 발송)
 * Edge Function invite-user 호출. 관리자(group === '관리자')만 호출 가능.
 * @param {string} email - 초대할 이메일
 * @param {string} group - 그룹명 (관리자, R&D, 사업지원팀 등)
 * @returns {{ ok: boolean, error?: string, message?: string }}
 */
export const inviteUserByEmail = async (email, group) => {
  if (!hasSupabaseEnv) {
    return { ok: false, error: ERROR_MESSAGES.SYSTEM_NOT_CONFIGURED };
  }
  try {
    // 세션 갱신 후 최신 토큰으로 /api/invite-user 호출 (Vercel rewrite → Edge Function)
    const { data: refreshData } = await supabase.auth.refreshSession();
    const session = refreshData?.session;
    const token = session?.access_token;
    if (!token) {
      return { ok: false, error: ERROR_MESSAGES.SESSION_REFRESH_FAILED };
    }

    const emailTrim = (email || '').toString().trim();
    const groupName = (group || '사업지원팀').toString().trim();

    const res = await fetch('/api/invite-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email: emailTrim, group: groupName }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        return { ok: false, error: ERROR_MESSAGES.SESSION_EXPIRED };
      }
      const msg =
        data?.error ??
        (res.status === 404 ? ERROR_MESSAGES.SERVICE_UNAVAILABLE : `요청 실패 (${res.status})`);
      return { ok: false, error: msg };
    }
    if (data?.error) {
      return { ok: false, error: data.error };
    }
    return { ok: true, message: data?.message ?? '초대 메일을 발송했습니다.' };
  } catch (err) {
    console.error('inviteUserByEmail error:', err);
    const isNetworkError =
      err?.message?.includes('Failed to send') ||
      err?.message?.includes('fetch') ||
      err?.name === 'TypeError';
    if (isNetworkError) {
      return { ok: false, error: ERROR_MESSAGES.NETWORK_ERROR };
    }
    return { ok: false, error: ERROR_MESSAGES.SERVICE_UNAVAILABLE };
  }
};

/**
 * 관리자 전용: Auth 등록 사용자 목록 조회
 * @returns {{ users: Array<{ id: string, email: string, created_at: string, user_metadata: object }> } | { error: string }}
 */
export const getAuthUsers = async () => {
  if (!hasSupabaseEnv) {
    return { error: ERROR_MESSAGES.SYSTEM_NOT_CONFIGURED };
  }
  try {
    const { data: refreshData } = await supabase.auth.refreshSession();
    const token = refreshData?.session?.access_token;
    if (!token) {
      return { error: ERROR_MESSAGES.SESSION_REFRESH_FAILED };
    }
    const res = await fetch('/api/auth-users', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) return { error: ERROR_MESSAGES.SESSION_EXPIRED };
      return {
        error:
          data?.error ??
          (res.status === 404 ? ERROR_MESSAGES.SERVICE_UNAVAILABLE : `요청 실패 (${res.status})`),
      };
    }
    if (data?.error) return { error: data.error };
    return {
      users: data?.users ?? [],
      authCount: data?.authCount,
      appUsersCount: data?.appUsersCount,
    };
  } catch (err) {
    console.error('getAuthUsers error:', err);
    const isNetwork =
      err?.message?.includes('Failed to send') ||
      err?.message?.includes('fetch') ||
      err?.name === 'TypeError';
    return { error: isNetwork ? ERROR_MESSAGES.NETWORK_ERROR : ERROR_MESSAGES.SERVICE_UNAVAILABLE };
  }
};

/**
 * 관리자 전용: Auth 사용자 삭제
 * @param {string} userId - 삭제할 사용자 Auth UUID
 * @returns {{ ok: boolean, error?: string }}
 */
export const deleteAuthUser = async (userId) => {
  if (!hasSupabaseEnv) {
    return { ok: false, error: ERROR_MESSAGES.SYSTEM_NOT_CONFIGURED };
  }
  try {
    const { data: refreshData } = await supabase.auth.refreshSession();
    const token = refreshData?.session?.access_token;
    if (!token) {
      return { ok: false, error: ERROR_MESSAGES.SESSION_REFRESH_FAILED };
    }
    const res = await fetch('/api/auth-users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: userId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) return { ok: false, error: ERROR_MESSAGES.SESSION_EXPIRED };
      return { ok: false, error: data?.error ?? `요청 실패 (${res.status})` };
    }
    if (data?.error) return { ok: false, error: data.error };
    return { ok: true };
  } catch (err) {
    console.error('deleteAuthUser error:', err);
    const isNetwork =
      err?.message?.includes('Failed to send') ||
      err?.message?.includes('fetch') ||
      err?.name === 'TypeError';
    return {
      ok: false,
      error: isNetwork ? ERROR_MESSAGES.NETWORK_ERROR : ERROR_MESSAGES.SERVICE_UNAVAILABLE,
    };
  }
};

export default api;
