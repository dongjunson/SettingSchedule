import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // 로컬 개발 시 /api/* → Supabase Edge Function으로 프록시
      '/api/invite-user': {
        target: 'https://lalrhxojwgbuwzybdgod.supabase.co',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/invite-user/, '/functions/v1/invite-user'),
      },
      '/api/auth-users': {
        target: 'https://lalrhxojwgbuwzybdgod.supabase.co',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/auth-users/, '/functions/v1/auth-users'),
      },
    },
  },
});
