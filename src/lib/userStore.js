import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FALLBACK_USERS, hasSupabaseEnv, STORAGE_KEYS } from './constants';
import { supabase } from './supabase';

export const useUserStore = create(
  persist(
    (set, get) => ({
      // 현재 사용자 정보
      currentUser: null,

      // 로그인 (이메일/비밀번호 기반, app_users.email + RPC pms_login_by_email로 검증)
      login: async (email, password) => {
        const emailTrim = (email || '').toString().trim().toLowerCase();
        if (!emailTrim || !password) {
          return { success: false, error: '이메일과 비밀번호를 입력해주세요.' };
        }

        // 1) Supabase 환경이면 DB(app_users.email) + RPC로 검증 후 Auth 세션 부여
        if (hasSupabaseEnv) {
          try {
            const { data, error } = await supabase.rpc('pms_login_by_email', {
              p_email: emailTrim,
              p_password: password,
            });

            if (error) {
              console.error('Supabase pms_login_by_email error:', error);
              return { success: false, error: '로그인에 실패했습니다. 관리자에게 문의하세요.' };
            }

            const row = Array.isArray(data) ? data[0] : data;

            if (row?.user_id) {
              // app_users에 있는 사용자: Auth 로그인 후 user_id/group 사용
              const { error: authError } = await supabase.auth.signInWithPassword({
                email: emailTrim,
                password,
              });
              if (authError) {
                console.error('Supabase Auth signIn error:', authError);
                const hint =
                  ' Supabase 대시보드 → Authentication → Users에서 해당 이메일 사용자를 추가하고, app_users와 동일한 비밀번호를 설정하세요.';
                const msg = authError.message || authError.code || 'Unknown';
                return {
                  success: false,
                  error: `세션 설정 실패: ${msg}.${hint}`,
                };
              }
              await supabase.auth.updateUser({
                data: { group: row.user_group || null },
              });
              set({
                currentUser: {
                  id: row.user_id,
                  group: row.user_group || null,
                },
              });
              return { success: true };
            }

            // app_users에 없음: 초대 사용자(Auth만 있음)일 수 있음 → Auth 로그인 시도
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
              email: emailTrim,
              password,
            });
            if (!authError && authData?.user) {
              const id = authData.user.email?.replace(/@.+$/, '') || emailTrim;
              const group = authData.user.user_metadata?.group ?? null;
              set({
                currentUser: { id, group },
              });
              return { success: true };
            }

            return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
          } catch (err) {
            console.error('Login failed:', err);
            return { success: false, error: '로그인 중 오류가 발생했습니다.' };
          }
        }

        // 2) Supabase 미설정 환경에서는 fallback 계정 (이메일로 매칭)
        const user = FALLBACK_USERS.find(
          (u) => u.email.toLowerCase() === emailTrim && u.password === password
        );
        if (user) {
          set({ currentUser: { id: user.id, group: user.group } });
          return { success: true };
        }
        return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
      },

      // 로그아웃 (Auth 세션 제거 → anon으로 돌아가 RLS로 테이블 접근 차단)
      logout: async () => {
        if (hasSupabaseEnv) {
          try {
            await supabase.auth.signOut();
          } catch (err) {
            console.warn('Auth signOut error:', err);
          }
        }
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

      // 앱 초기 로드 시 Auth 세션 복원 (새로고침 후 로그인 유지)
      restoreSession: async () => {
        if (!hasSupabaseEnv) return;
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user?.email) {
          set({ currentUser: null });
          return;
        }
        const id = session.user.email.replace(/@.+$/, '');
        if (!id) {
          set({ currentUser: null });
          return;
        }
        const group = session.user.user_metadata?.group ?? null;
        set({ currentUser: { id, group } });
      },
    }),
    {
      name: STORAGE_KEYS.CURRENT_USER,
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
