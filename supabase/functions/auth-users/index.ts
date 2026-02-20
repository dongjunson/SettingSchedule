// Supabase Edge Function: 관리자 전용 Auth 사용자 목록 조회 및 삭제
// GET: 목록 조회, DELETE: 사용자 삭제 (body: { id: string })

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const clientWithAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user } } = await clientWithAuth.auth.getUser(token);
    const group = user?.user_metadata?.group ?? null;
    if (group !== '관리자') {
      return new Response(
        JSON.stringify({ error: '관리자만 사용자 목록을 조회하거나 삭제할 수 있습니다.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (req.method === 'GET') {
      const { data: listData, error } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const users = (listData?.users ?? []).map((u) => ({
        id: u.id,
        email: u.email ?? '',
        created_at: u.created_at,
        user_metadata: u.user_metadata ?? {},
      }));
      return new Response(
        JSON.stringify({ users }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      const body = await req.json().catch(() => ({}));
      const id = typeof body?.id === 'string' ? body.id.trim() : '';
      if (!id) {
        return new Response(
          JSON.stringify({ error: '삭제할 사용자 id가 필요합니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // 본인 삭제 방지
      if (id === user?.id) {
        return new Response(
          JSON.stringify({ error: '자기 자신은 삭제할 수 없습니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const { error: delError } = await adminClient.auth.admin.deleteUser(id);
      if (delError) {
        return new Response(
          JSON.stringify({ error: delError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e?.message ?? 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
