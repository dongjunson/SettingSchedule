import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 로컬 개발 시 .env 의 VITE_VERCEL_APP_URL 사용 (배포된 앱 URL)
  const env = loadEnv(mode, process.cwd(), '');
  const vercelAppUrl = env.VITE_VERCEL_APP_URL || '';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        // 로컬 개발 시 /api/invite-user → Supabase Edge Function
        '/api/invite-user': {
          target: 'https://lalrhxojwgbuwzybdgod.supabase.co',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/invite-user/, '/functions/v1/invite-user'),
        },
        // 로컬 개발 시 /api/auth-users → 배포된 Vercel 앱으로 프록시 (VITE_VERCEL_APP_URL 필수)
        ...(vercelAppUrl && {
          '/api/auth-users': {
            target: vercelAppUrl.replace(/\/$/, ''),
            changeOrigin: true,
          },
          '/api/health-check': {
            target: vercelAppUrl.replace(/\/$/, ''),
            changeOrigin: true,
          },
        }),
      },
    },
  };
});
