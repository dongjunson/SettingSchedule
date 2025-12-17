// 이메일/비밀번호 기반 사용자 인증 관리
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const USER_STORAGE_KEY = 'current_user';

// 배포할 사용자 계정 목록 (이메일 형식의 아이디와 비밀번호, 그룹)
const AUTHORIZED_USERS = [
  { email: 'user1@example.com', password: 'password123', group: 'R&D' },
  { email: 'user2@example.com', password: 'password123', group: '사업지원팀' },
  { email: 'admin@example.com', password: 'admin123', group: 'R&D' },
  // 여기에 배포할 사용자 계정을 추가하세요
  // { email: 'user@example.com', password: 'yourpassword', group: 'R&D' 또는 '사업지원팀' },
];

export const useUserStore = create(
  persist(
    (set, get) => ({
      // 현재 사용자 정보
      currentUser: null,

      // 로그인 (이메일과 비밀번호로 인증)
      login: (email, password) => {
        if (!email || !password) {
          return { success: false, error: '이메일과 비밀번호를 입력해주세요.' };
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return { success: false, error: '올바른 이메일 형식이 아닙니다.' };
        }

        // 인증된 사용자 목록에서 확인
        const user = AUTHORIZED_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (user) {
          set({ currentUser: { email: user.email, group: user.group || 'R&D' } });
          return { success: true };
        }
        return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
      },

      // 로그아웃
      logout: () => {
        set({ currentUser: null });
      },

      // 현재 사용자 이메일 가져오기
      getEmail: () => {
        const user = get().currentUser;
        return user?.email || null;
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
      name: USER_STORAGE_KEY,
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
