import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      const missing = [];
      if (!supabaseUrl) missing.push('SUPABASE_URL 또는 VITE_SUPABASE_URL');
      if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY 또는 VITE_SUPABASE_ANON_KEY');
      if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
      const message = [
        '서버 설정이 올바르지 않습니다. 누락된 환경 변수: ' + missing.join(', '),
        'Vercel 대시보드 → 프로젝트 → Settings → Environment Variables 에서 추가한 뒤 Redeploy 하세요.',
        'SUPABASE_SERVICE_ROLE_KEY는 Supabase 대시보드 → Settings → API 에서 확인할 수 있습니다.',
      ].join(' ');
      return jsonResponse({ error: message }, 500);
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Authorization header required' }, 401);
    }
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return jsonResponse({ error: 'Authorization header required' }, 401);
    }

    try {
      const clientWithAuth = createClient(supabaseUrl, supabaseAnonKey);
      const {
        data: { user },
      } = await clientWithAuth.auth.getUser(token);
      const group = user?.user_metadata?.group ?? null;
      if (group !== '관리자') {
        return jsonResponse(
          { error: '관리자만 사용자 목록을 조회하거나 삭제할 수 있습니다.' },
          403
        );
      }

      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      if (request.method === 'GET') {
        const { data: listData, error } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        if (error) {
          return jsonResponse({ error: error.message }, 400);
        }
        const users = (listData?.users ?? []).map((u) => ({
          id: u.id,
          email: u.email ?? '',
          created_at: u.created_at,
          user_metadata: u.user_metadata ?? {},
        }));
        return jsonResponse({ users });
      }

      if (request.method === 'DELETE') {
        const body = await request.json().catch(() => ({}));
        const id = typeof body?.id === 'string' ? body.id.trim() : '';
        if (!id) {
          return jsonResponse({ error: '삭제할 사용자 id가 필요합니다.' }, 400);
        }
        if (id === user?.id) {
          return jsonResponse({ error: '자기 자신은 삭제할 수 없습니다.' }, 400);
        }
        const { error: delError } = await adminClient.auth.admin.deleteUser(id);
        if (delError) {
          return jsonResponse({ error: delError.message }, 400);
        }
        return jsonResponse({ ok: true });
      }

      return jsonResponse({ error: 'Method not allowed' }, 405);
    } catch (e) {
      return jsonResponse(
        { error: e?.message ?? 'Unknown error' },
        500
      );
    }
  },
};
