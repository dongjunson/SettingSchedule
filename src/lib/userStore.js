// 간단한 사용자 상태 관리
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const USER_STORAGE_KEY = 'current_user';

export const useUserStore = create(
  persist(
    (set, get) => ({
      // 현재 사용자 정보
      currentUser: null,

      // 로그인 (닉네임 설정)
      setUser: (nickname) => {
        if (!nickname || nickname.trim() === '') return;
        set({ currentUser: { nickname: nickname.trim() } });
      },

      // 로그아웃
      clearUser: () => {
        set({ currentUser: null });
      },

      // 현재 사용자 닉네임 가져오기
      getNickname: () => {
        const user = get().currentUser;
        return user?.nickname || null;
      },

      // 로그인 여부 확인
      isLoggedIn: () => {
        return get().currentUser !== null;
      },
    }),
    {
      name: USER_STORAGE_KEY,
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
