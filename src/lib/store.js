// zustand를 사용한 상태 관리 및 API 연동

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchSiteTimelineData, fetchAllSitesData, updateTimelineItemOnServer, updateChecklistItemOnServer } from './api';

const STORAGE_KEY = 'site_timeline_data';

// 초기 타임라인 데이터
const getInitialTimeline = () => [
  // 구축 및 설치
  { id: 1, step: '01', task: '중계기 세팅', section: '구축 및 설치', status: 'completed', role: 'both', completedAt: '2025-12-11T10:00:00Z' },
  { id: 2, step: '02', task: 'VPN 세팅', section: '구축 및 설치', status: 'completed', role: 'rnd' },
  { id: 3, step: '03', task: '포트포워딩 세팅', section: '구축 및 설치', status: 'completed', role: 'rnd' },
  { id: 4, step: '04', task: '네트워크 서버 설치', section: '구축 및 설치', status: 'completed', role: 'field' },
  { id: 5, step: '05', task: 'IP 할당', section: '구축 및 설치', status: 'completed', role: 'rnd' },
  { id: 6, step: '06', task: '운영서버 설치', section: '구축 및 설치', status: 'completed', role: 'rnd' },
  { id: 7, step: '07', task: '도면 세팅', section: '구축 및 설치', status: 'completed', role: 'field' },
  { id: 8, step: '08', task: '비콘 데이터 대시보드 등록', section: '구축 및 설치', status: 'completed', role: 'both' },
  { id: 9, step: '09', task: '알리고 세팅', section: '구축 및 설치', status: 'completed', role: 'both' },
  { id: 10, step: '10', task: '트래커 EUI LIST 확인', section: '구축 및 설치', status: 'completed', role: 'both' },
  { id: 11, step: '11', task: '비콘 설치', section: '구축 및 설치', status: 'pending', role: 'both' },
  { id: 12, step: '12', task: '지오 펜스 & 셀 플래닝', section: '구축 및 설치', status: 'pending', role: 'both' },
  { id: 13, step: '13', task: '트래커 스마트 워치 MAC 매핑', section: '구축 및 설치', status: 'completed', role: 'both' },
  { id: 14, step: '14', task: '스마트 워치 APK 설치', section: '구축 및 설치', status: 'completed', role: 'both' },
  // 대시보드 필드 테스트
  { id: 15, step: '15', task: '고정형 검침기 데이타 확인', section: '대시보드 필드 테스트', status: 'pending', role: 'both' },
  { id: 16, step: '16', task: '이동형 검침기 데이타 확인', section: '대시보드 필드 테스트', status: 'completed', role: 'both' },
  { id: 17, step: '17', task: '스마트워치 데이타 확인', section: '대시보드 필드 테스트', status: 'completed', role: 'both' },
  // 준공 및 문서
  { id: 18, step: '18', task: '점검 리스트 확인', section: '준공 및 문서', status: 'working', role: 'both' },
  { id: 19, step: '19', task: '준공 문서 제출', section: '준공 및 문서', status: 'pending', role: 'both' },
  { id: 20, step: '20', task: '매뉴얼 문서 작업', section: '준공 및 문서', status: 'pending', role: 'both' },
];

// 초기 체크리스트 데이터
const getInitialChecklist = () => [
  { id: 1, text: '위급상황(심박위험, 유해가스위험, SOS신호), 위험작업(위험 작업), 현재 작업자 현황(잔류 작업자 수, 전체 입실자 수, 전체 퇴실자 수)', checked: true },
  { id: 2, text: '작업자가 트래커를 착용해서 위치비콘이 설치된 곳에 위치하면 대시보드에 착용자의 위치가 출력되는가', checked: true },
  { id: 3, text: '작업자의 이름, 위치, 심박수, 가스정보(이동형 가스검지기) 등 데이터가 대시보드에 출력되는가', checked: true },
  { id: 4, text: '작업자목록에서 작업자의 행을 클릭하였을 때 작업자의 동선이력이 대시보드에 출력되는가', checked: true },
  { id: 5, text: '배터리 및 상태 이상 IoT 센서 현황으로 장비명(IoT 센서로 명칭 그룹화), 위치, 배터리가 대시보드에 출력되는가', checked: false },
  { id: 6, text: '위급상황 현황으로 작업자, 위치, 위급상황, 발생시간이 대시보드에 출력되는가', checked: true },
  { id: 7, text: '작업목록에서 작업명, 위험도, 위치, 작업자 수, 작업예정일시 및 시작일시, 작업종료일시 작업상태가 대시보드에 출력되는가', checked: false },
  { id: 8, text: '고정형비콘목록에서 비콘 이름, Major Minor, 위치, 배터리가 대시보드에 출력되는가', checked: true },
  { id: 9, text: '트래커목록에서 트래커 이름, 작업자명, 배터리, 사용여부, SOS-ON, 발생시간이 대시보드에 출력되는가', checked: true },
  { id: 10, text: '워치목록에서 워치 이름, 작업자명, 심박수, 배터리, 사용여부, 발생시간이 대시보드에 출력되는가', checked: true },
  { id: 11, text: '이동형 가스검지기 목록에서 가스센서 이름, 작업자명, 5종가스데이터(CO, CO2, H2S, O2, LEL), 배터리, 사용여부, 발생시간이 대시보드에 출력되는가', checked: true },
  { id: 12, text: '위치이력, 워치 및 가스센서 이력, 알림이력이 조회 및 백업 데이터로 엑셀파일 생성이 가능한가', checked: true },
  { id: 13, text: '위험 알림 발생 시(심박수, 유해가스 허용범위를 넘어설 경우,SOS 신호 등), 어느화면에서든 위험 알림 팝업이 출력되는가', checked: true },
  { id: 14, text: '위험 알림 발생 시 안전관리자의 스마트폰에 SOS 팝업 정보 문자 메세지가 자동 & 수동으로 전달되는가', checked: true },
  { id: 15, text: '운영서버에서 개인별로 매핑된 갤럭시 워치의 심박수를 최소,최대로 조절이 가능한가', checked: true },
  { id: 16, text: '입/퇴사자 발생시 작업자 계정 생성/삭제와 트래커, 갤럭시 워치, 휴대용 가스검지기가 매핑되는가', checked: true },
  { id: 17, text: '해당 위치에 설치된 고정형 가스검침기의 가스데이터(2종, O2와 H2S)가 대시보드에 출력되는가', checked: true },
  { id: 18, text: '고정형 가스 검지기에서 허용범위를 넘어설 경우 대시보드에 빨간색으로 위험신호로 표시가 되는가', checked: true },
  { id: 19, text: '고정형 가스 검지기에서 허용범위를 넘어설 경우 알림을 표시하고 관리자에게 문자로 전송되는가', checked: true },
];

// 초기 데이터 구조
const getInitialData = () => ({
  sites: [
    {
      id: 'anyang-bakdal',
      name: '안양 박달 사업소',
      timeline: getInitialTimeline(),
      checklist: getInitialChecklist(),
    },
  ],
});

// 체크리스트 검증 및 업데이트 헬퍼 함수
const validateAndUpdateChecklist = (checklist) => {
  if (!checklist || checklist.length !== 19) {
    const newChecklist = getInitialChecklist();
    if (checklist) {
      newChecklist.forEach((newItem) => {
        const existingItem = checklist.find(item => 
          item.id === newItem.id || item.text === newItem.text
        );
        if (existingItem) {
          newItem.checked = existingItem.checked;
        }
      });
    }
    return newChecklist;
  }
  
  // id가 1-19 범위를 벗어나는 항목이 있으면 제거
  const validIds = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  const hasInvalidId = checklist.some(item => !validIds.has(item.id));
  if (hasInvalidId) {
    return checklist.filter(item => validIds.has(item.id));
  }
  
  return checklist;
};

// zustand 스토어 생성
export const useStore = create(
  persist(
    (set, get) => ({
      // 상태
      sites: getInitialData().sites,
      loading: false,
      error: null,

      // 모든 사업소 데이터 로드 (API에서)
      loadAllSites: async (forceRefresh = true) => {
        set({ loading: true, error: null });
        try {
          const data = await fetchAllSitesData();
          
          let sites = [];
          
          // API 응답이 { sites: [...] } 형태인지 확인
          if (data && data.sites && Array.isArray(data.sites)) {
            sites = data.sites;
          } else if (Array.isArray(data)) {
            sites = data;
          } else {
            throw new Error('Invalid API response format');
          }

          // 체크리스트 검증 및 업데이트
          sites = sites.map(site => ({
            ...site,
            checklist: validateAndUpdateChecklist(site.checklist),
          }));

          set({ sites, loading: false });
          return { sites };
        } catch (error) {
          console.error('Failed to load data from API:', error);
          const cachedSites = get().sites;
          if (cachedSites && cachedSites.length > 0) {
            set({ loading: false, error: null });
            return { sites: cachedSites };
          }
          // 캐시도 없으면 초기 데이터 반환
          const initialData = getInitialData();
          set({ sites: initialData.sites, loading: false, error: null });
          return initialData;
        }
      },

      // 특정 사업소 데이터 로드 (API에서)
      loadSite: async (siteId, forceRefresh = true) => {
        set({ loading: true, error: null });
        try {
          const siteData = await fetchSiteTimelineData(siteId);
          
          let site = null;
          
          // API 응답이 직접 사이트 객체인 경우
          if (siteData && siteData.id) {
            site = siteData;
          } else if (siteData && siteData.site) {
            site = siteData.site;
          } else {
            throw new Error('Invalid API response format');
          }

          // 체크리스트 검증
          site.checklist = validateAndUpdateChecklist(site.checklist);

          // 스토어에 업데이트
          const currentSites = get().sites;
          const siteIndex = currentSites.findIndex(s => s.id === siteId);
          
          if (siteIndex !== -1) {
            set({
              sites: currentSites.map((s, idx) => idx === siteIndex ? site : s),
              loading: false,
            });
          } else {
            set({
              sites: [...currentSites, site],
              loading: false,
            });
          }

          return site;
        } catch (error) {
          console.error('Failed to fetch site data from API:', error);
          // API 실패 시에만 캐시에서 가져오기
          const cachedSite = get().sites.find(s => s.id === siteId);
          if (cachedSite) {
            set({ loading: false, error: null });
            return cachedSite;
          }
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // 타임라인 항목 업데이트
      updateTimelineItem: async (siteId, itemId, updates) => {
        const currentSites = get().sites;
        const site = currentSites.find(s => s.id === siteId);
        
        if (!site) {
          console.error('Site not found:', siteId);
          return null;
        }

        const itemIndex = site.timeline.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
          console.error('Timeline item not found:', itemId);
          return null;
        }

        // 로컬 상태 먼저 업데이트 (낙관적 업데이트)
        const updatedTimeline = [...site.timeline];
        updatedTimeline[itemIndex] = { ...updatedTimeline[itemIndex], ...updates };
        
        const updatedSite = {
          ...site,
          timeline: updatedTimeline,
        };

        const updatedSites = currentSites.map(s => s.id === siteId ? updatedSite : s);
        set({ sites: updatedSites });

        // 서버에 업데이트 시도 (실패해도 로컬 상태는 유지)
        try {
          await updateTimelineItemOnServer(siteId, itemId, updates);
        } catch (error) {
          console.error('Failed to update timeline item on server:', error);
          // 서버 업데이트 실패 시에도 로컬 상태는 유지
        }

        return updatedTimeline[itemIndex];
      },

      // 체크리스트 항목 업데이트
      updateChecklistItem: async (siteId, itemId, checked) => {
        const currentSites = get().sites;
        const site = currentSites.find(s => s.id === siteId);
        
        if (!site) {
          console.error('Site not found:', siteId);
          return null;
        }

        const itemIndex = site.checklist.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
          console.error('Checklist item not found:', itemId);
          return null;
        }

        // 로컬 상태 먼저 업데이트 (낙관적 업데이트)
        const updatedChecklist = [...site.checklist];
        updatedChecklist[itemIndex] = { ...updatedChecklist[itemIndex], checked };
        
        const updatedSite = {
          ...site,
          checklist: updatedChecklist,
        };

        const updatedSites = currentSites.map(s => s.id === siteId ? updatedSite : s);
        set({ sites: updatedSites });

        // 서버에 업데이트 시도 (실패해도 로컬 상태는 유지)
        try {
          await updateChecklistItemOnServer(siteId, itemId, checked);
        } catch (error) {
          console.error('Failed to update checklist item on server:', error);
          // 서버 업데이트 실패 시에도 로컬 상태는 유지
        }

        return updatedChecklist[itemIndex];
      },

      // 진행도 계산
      calculateProgress: (siteId) => {
        const site = get().sites.find(s => s.id === siteId);
        if (!site) return { timeline: 0, checklist: 0, overall: 0 };

        // 타임라인 진행도 (status가 completed인 항목 비율)
        const timelineTotal = site.timeline.length;
        const timelineCompleted = site.timeline.filter(item => item.status === 'completed').length;
        const timelineProgress = (timelineCompleted / timelineTotal) * 100;

        // 체크리스트 진행도
        const checklistTotal = site.checklist.length;
        const checklistCompleted = site.checklist.filter(item => item.checked).length;
        const checklistProgress = (checklistCompleted / checklistTotal) * 100;

        // 전체 진행도 (타임라인 70%, 체크리스트 30%)
        const overallProgress = (timelineProgress * 0.7) + (checklistProgress * 0.3);

        return {
          timeline: Math.round(timelineProgress),
          checklist: Math.round(checklistProgress),
          overall: Math.round(overallProgress),
        };
      },

      // 사업소 데이터 가져오기 (동기)
      getSite: (siteId) => {
        return get().sites.find(site => site.id === siteId) || null;
      },
    }),
    {
      name: STORAGE_KEY,
      // persist 옵션: sites만 저장
      partialize: (state) => ({ sites: state.sites }),
    }
  )
);
