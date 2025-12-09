// localStorage를 사용한 데이터 관리

const STORAGE_KEY = 'site_timeline_data';

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

// 초기 타임라인 데이터
const getInitialTimeline = () => [
  // 구축 및 설치
  { id: 1, step: '01', task: '중계기 세팅', section: '구축 및 설치', rnd: 'completed', field: 'completed' },
  { id: 2, step: '02', task: 'VPN 세팅', section: '구축 및 설치', rnd: 'completed', field: 'completed' },
  { id: 3, step: '03', task: '포트포워딩 세팅', section: '구축 및 설치', rnd: 'completed', field: 'completed' },
  { id: 4, step: '04', task: '네트워크 서버 설치', section: '구축 및 설치', rnd: 'completed', field: 'completed' },
  { id: 5, step: '05', task: 'IP 할당', section: '구축 및 설치', rnd: 'completed', field: 'completed' },
  { id: 6, step: '06', task: '운영서버 설치', section: '구축 및 설치', rnd: 'completed', field: 'completed' },
  { id: 7, step: '07', task: '도면 세팅', section: '구축 및 설치', rnd: 'completed', field: 'completed' },
  { id: 8, step: '08', task: '비콘 데이터 대시보드 등록', section: '구축 및 설치', rnd: 'completed', field: 'completed' },
  { id: 9, step: '09', task: '알리고 세팅', section: '구축 및 설치', rnd: 'completed', field: 'completed' },
  { id: 10, step: '10', task: '트래커 EUI LIST 확인', section: '구축 및 설치', rnd: 'completed', field: 'completed' },
  { id: 11, step: '11', task: '비콘 설치', section: '구축 및 설치', rnd: 'pending', field: 'completed' },
  { id: 12, step: '12', task: '지오 펜스 & 셀 플래닝 대시보드 적용', section: '구축 및 설치', rnd: 'pending', field: 'completed' },
  { id: 13, step: '13', task: '트래커 스마트 워치 MAC 매핑', section: '구축 및 설치', rnd: 'completed', field: 'completed' },
  { id: 14, step: '14', task: '스마트 워치 APK 설치', section: '구축 및 설치', rnd: 'completed', field: 'completed' },
  // 대시보드 필드 테스트
  { id: 15, step: '15', task: '고정형 검침기 데이타 확인', section: '대시보드 필드 테스트', rnd: 'pending', field: 'pending' },
  { id: 16, step: '16', task: '이동형 검침기 데이타 확인', section: '대시보드 필드 테스트', rnd: 'completed', field: 'completed' },
  { id: 17, step: '17', task: '스마트워치 데이타 확인', section: '대시보드 필드 테스트', rnd: 'completed', field: 'completed' },
  // 준공 및 문서
  { id: 18, step: '18', task: '점검 리스트 확인', section: '준공 및 문서', rnd: 'working', field: 'working' },
  { id: 19, step: '19', task: '준공 문서 제출', section: '준공 및 문서', rnd: 'pending', field: 'pending' },
  { id: 20, step: '20', task: '매뉴얼 문서 작업', section: '준공 및 문서', rnd: 'pending', field: 'pending' },
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

// 데이터 로드
export const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // 체크리스트 항목 수가 19개가 아니면 초기화
      if (data.sites && data.sites.length > 0) {
        let needsUpdate = false;
        data.sites.forEach(site => {
          if (site.checklist) {
            // 체크리스트 항목 수 확인 및 업데이트
            if (site.checklist.length !== 19) {
              // 기존 체크 상태를 보존하면서 새 체크리스트로 업데이트
              const newChecklist = getInitialChecklist();
              newChecklist.forEach((newItem, index) => {
                // 기존 항목에서 같은 id나 같은 텍스트를 가진 항목의 checked 상태를 유지
                const existingItem = site.checklist.find(item => 
                  item.id === newItem.id || item.text === newItem.text
                );
                if (existingItem) {
                  newItem.checked = existingItem.checked;
                }
              });
              site.checklist = newChecklist;
              needsUpdate = true;
            } else {
              // id가 1-19 범위를 벗어나는 항목이 있으면 제거
              const validIds = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
              const hasInvalidId = site.checklist.some(item => !validIds.has(item.id));
              if (hasInvalidId) {
                site.checklist = site.checklist.filter(item => validIds.has(item.id));
                needsUpdate = true;
              }
            }
          } else {
            site.checklist = getInitialChecklist();
            needsUpdate = true;
          }
        });
        if (needsUpdate) {
          saveData(data);
        }
      }
      return data;
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  }
  return getInitialData();
};

// 데이터 저장
export const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data:', error);
  }
};

// 사업소 데이터 가져오기
export const getSiteData = (siteId) => {
  const data = loadData();
  return data.sites.find(site => site.id === siteId);
};

// 사업소 데이터 업데이트
export const updateSiteData = (siteId, updates) => {
  const data = loadData();
  const siteIndex = data.sites.findIndex(site => site.id === siteId);
  if (siteIndex !== -1) {
    data.sites[siteIndex] = { ...data.sites[siteIndex], ...updates };
    saveData(data);
    return data.sites[siteIndex];
  }
  return null;
};

// 타임라인 항목 업데이트
export const updateTimelineItem = (siteId, itemId, updates) => {
  const data = loadData();
  const site = data.sites.find(s => s.id === siteId);
  if (site) {
    const itemIndex = site.timeline.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      site.timeline[itemIndex] = { ...site.timeline[itemIndex], ...updates };
      saveData(data);
      return site.timeline[itemIndex];
    }
  }
  return null;
};

// 체크리스트 항목 업데이트
export const updateChecklistItem = (siteId, itemId, checked) => {
  const data = loadData();
  const site = data.sites.find(s => s.id === siteId);
  if (site) {
    const itemIndex = site.checklist.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      site.checklist[itemIndex].checked = checked;
      saveData(data);
      return site.checklist[itemIndex];
    }
  }
  return null;
};

// 진행도 계산
export const calculateProgress = (siteId) => {
  const site = getSiteData(siteId);
  if (!site) return { timeline: 0, checklist: 0, overall: 0 };

  // 타임라인 진행도 (R&D와 현장팀 모두 완료된 항목 비율)
  const timelineTotal = site.timeline.length * 2; // R&D + 현장팀
  const timelineCompleted = site.timeline.reduce((count, item) => {
    return count + (item.rnd === 'completed' ? 1 : 0) + (item.field === 'completed' ? 1 : 0);
  }, 0);
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
};
