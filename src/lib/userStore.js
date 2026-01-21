import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from './constants';
import { supabase } from './supabase';

const hasSupabaseEnv = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Supabase 미설정(로컬/데모)일 때만 사용하는 fallback 계정
const FALLBACK_USERS = [
  { id: 'admin', password: 'joy&rising', group: '관리자' },
  { id: 'rnd', password: 'joy&rising', group: 'R&D' },
  { id: 'system', password: 'joy&rising', group: '사업지원팀' },
];

export const useUserStore = create(
  persist(
    (set, get) => ({
      // 현재 사용자 정보
      currentUser: null,

      // 로그인 (아이디/비밀번호 기반, Supabase RPC로 검증)
      login: async (id, password) => {
        const userId = (id || '').toString().trim();
        if (!userId || !password) {
          return { success: false, error: '아이디와 비밀번호를 입력해주세요.' };
        }

        // 1) Supabase 환경이면 DB의 사전 발급 계정(app_users) + RPC로 검증
        if (hasSupabaseEnv) {
          try {
            const { data, error } = await supabase.rpc('pms_login', {
              p_user_id: userId,
              p_password: password,
            });

            if (error) {
              console.error('Supabase pms_login error:', error);
              return { success: false, error: '로그인에 실패했습니다. 관리자에게 문의하세요.' };
            }

            // Supabase RPC returns array by default for set-returning functions
            const row = Array.isArray(data) ? data[0] : data;
            if (!row?.user_id) {
              return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
            }

            set({
              currentUser: {
                id: row.user_id,
                group: row.user_group || null,
              },
            });
            return { success: true };
          } catch (err) {
            console.error('Login failed:', err);
            return { success: false, error: '로그인 중 오류가 발생했습니다.' };
          }
        }

        // 2) Supabase 미설정 환경에서는 fallback 계정으로 동작 (개발/데모)
        const user = FALLBACK_USERS.find((u) => u.id === userId && u.password === password);
        if (user) {
          set({ currentUser: { id: user.id, group: user.group } });
          return { success: true };
        }
        return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
      },

      // 로그아웃
      logout: () => {
        set({ currentUser: null });
      },

      // 현재 사용자 아이디 가져오기
      getId: () => {
        const user = get().currentUser;
        return user?.id || null;
      },

      // 현재 사용자 그룹 가져오기
      getGroup: () => {
        const user = get().currentUser;
        return user?.group || null;
      },

      // 로그인 여부 확인
      isLoggedIn: () => {
        return get().currentUser !== null;
      },
    }),
    {
      name: STORAGE_KEYS.CURRENT_USER,
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
