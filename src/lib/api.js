import axios from 'axios';
import { supabase } from './supabase';

// API 기본 URL 설정 (환경변수 또는 기본값)
// - Supabase 미설정 환경에서도 기존 REST API(있다면)로 동작하도록 fallback을 유지합니다.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// axios 인스턴스 생성 (fallback)
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const hasSupabaseEnv = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

const mapTimelineRowToItem = (row) => ({
  // bigint identity can overflow JS number precision; keep as string
  id: String(row.id),
  siteId: row.site_id ?? null,
  step: row.step ?? '',
  task: row.task ?? '',
  section: row.section ?? '',
  subsection: row.subsection ?? null,
  status: row.status ?? 'pending',
  role: row.role ?? 'both',
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

const mapSiteRowToSite = (row) => ({
  id: row.id,
  name: row.name,
  timeline: Array.isArray(row.timeline_items) ? row.timeline_items.map(mapTimelineRowToItem) : [],
  checklist: Array.isArray(row.checklist_items)
    ? row.checklist_items.map(mapChecklistRowToItem)
    : [],
});

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
      .select('*, timeline_items(*), checklist_items(*)');

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

  // 1) Create site
  const { error: siteError } = await supabase.from('sites').insert({ id: siteId, name: siteName });
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
      status: item.status ?? 'pending',
      role: item.role ?? 'both',
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
    status: item.status ?? 'pending',
    role: item.role ?? 'both',
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

export default api;
