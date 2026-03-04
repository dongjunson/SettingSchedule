/**
 * GET /api/health-check?url=...
 * 서버에서 대상 URL에 HEAD 요청을 보내 응답 가능 여부를 반환합니다. (CORS 회피)
 */
const TIMEOUT_MS = 8000;
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

export default {
  async fetch(request) {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const target = url.searchParams.get('url');
    if (!target || typeof target !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'url query required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let parsed;
    try {
      parsed = new URL(target.trim());
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return new Response(JSON.stringify({ ok: false, error: 'Only http/https allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(parsed.toString(), {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'PMS-HealthCheck/1.0' },
      });
      clearTimeout(timeoutId);
      const ok = res.status >= 200 && res.status < 400;
      return new Response(JSON.stringify({ ok }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      clearTimeout(timeoutId);
      return new Response(JSON.stringify({ ok: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
