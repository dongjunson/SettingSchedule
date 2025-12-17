// zustand를 사용한 상태 관리 및 API 연동

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  fetchAllSitesData,
  fetchSiteTimelineData,
  updateChecklistItemOnServer,
  updateTimelineItemOnServer,
} from './api';

const STORAGE_KEY = 'site_timeline_data';

// 초기 타임라인 데이터
const getInitialTimeline = () => [
  // 1. 구축 및 설치
  // 1-1. 사전 준비
  {
    id: 1,
    step: '1-01',
    task: 'Kick-Off',
    section: '구축 및 설치',
    subsection: '사전 준비',
    status: 'pending',
    role: 'both',
  },
  {
    id: 2,
    step: '1-02',
    task: '현장 답사시 비콘 갯수 픽스',
    section: '구축 및 설치',
    subsection: '사전 준비',
    status: 'pending',
    role: 'field',
  },
  {
    id: 3,
    step: '1-03',
    task: '비콘 번호 체계표 생성 및 비콘 개발사에 전달',
    section: '구축 및 설치',
    subsection: '사전 준비',
    status: 'pending',
    role: 'field',
  },
  {
    id: 4,
    step: '1-04',
    task: '계약 FIX 되면 운영 서버 개발사에 개발 요청',
    section: '구축 및 설치',
    subsection: '사전 준비',
    status: 'pending',
    role: 'rnd',
  },
  {
    id: 5,
    step: '1-05',
    task: '제품 발주',
    section: '구축 및 설치',
    subsection: '사전 준비',
    status: 'pending',
    role: 'field',
  },
  // 1-2. 인프라 구축
  {
    id: 6,
    step: '1-06',
    task: 'IP 할당 및 구축',
    section: '구축 및 설치',
    subsection: '인프라 구축',
    status: 'pending',
    role: 'field',
    startDate: '2024-12-19',
    completionDate: '2024-12-19',
  },
  {
    id: 7,
    step: '1-07',
    task: '포트포워딩',
    section: '구축 및 설치',
    subsection: '인프라 구축',
    status: 'pending',
    role: 'field',
    startDate: '2024-12-19',
    completionDate: '2024-12-19',
  },
  {
    id: 8,
    step: '1-08',
    task: '중계기 설치 실사 동행 및 송수신 통신 테스트',
    section: '구축 및 설치',
    subsection: '인프라 구축',
    status: 'pending',
    role: 'field',
  },
  {
    id: 9,
    step: '1-09',
    task: '중계기 세팅',
    section: '구축 및 설치',
    subsection: '인프라 구축',
    status: 'pending',
    role: 'field',
  },
  {
    id: 10,
    step: '1-10',
    task: '중계기 음영지역 테스트',
    section: '구축 및 설치',
    subsection: '인프라 구축',
    status: 'pending',
    role: 'field',
  },
  {
    id: 11,
    step: '1-11',
    task: '중계기 방폭존 잔여 설치 공사',
    section: '구축 및 설치',
    subsection: '인프라 구축',
    status: 'pending',
    role: 'field',
  },
  {
    id: 12,
    step: '1-12',
    task: 'VPN 세팅',
    section: '구축 및 설치',
    subsection: '인프라 구축',
    status: 'pending',
    role: 'field',
  },
  {
    id: 13,
    step: '1-13',
    task: 'Lora 네트워크 서버 현장 서버실 설치',
    section: '구축 및 설치',
    subsection: '인프라 구축',
    status: 'pending',
    role: 'field',
  },
  {
    id: 14,
    step: '1-14',
    task: '통신 품질테스트',
    section: '구축 및 설치',
    subsection: '인프라 구축',
    status: 'pending',
    role: 'field',
  },
  {
    id: 15,
    step: '1-15',
    task: '중계기 품질 측정',
    section: '구축 및 설치',
    subsection: '인프라 구축',
    status: 'pending',
    role: 'field',
  },
  // 1-3. 가스검침기 설치
  {
    id: 16,
    step: '1-16',
    task: 'PPM 고정가스 검침기 설치용 AP 셋팅을 위한 전송 서버 주소 및 고유 아이디 생성 및 배포',
    section: '구축 및 설치',
    subsection: '가스검침기 설치',
    status: 'pending',
    role: 'field',
  },
  {
    id: 17,
    step: '1-17',
    task: 'PPM 고정가스 검침기 설치',
    section: '구축 및 설치',
    subsection: '가스검침기 설치',
    status: 'pending',
    role: 'field',
  },
  // 1-4. 운영서버 설치
  {
    id: 18,
    step: '1-18',
    task: '알리고 API 신규 사업소 IP 등록',
    section: '구축 및 설치',
    subsection: '운영서버 설치',
    status: 'pending',
    role: 'rnd',
  },
  {
    id: 19,
    step: '1-19',
    task: '운영서버 준비 완료 확인',
    section: '구축 및 설치',
    subsection: '운영서버 설치',
    status: 'pending',
    role: 'rnd',
  },
  {
    id: 20,
    step: '1-20',
    task: '운영서버 현장 서버실 설치',
    section: '구축 및 설치',
    subsection: '운영서버 설치',
    status: 'pending',
    role: 'field',
  },
  {
    id: 21,
    step: '1-21',
    task: '운영서버 URL 확인',
    section: '구축 및 설치',
    subsection: '운영서버 설치',
    status: 'pending',
    role: 'field',
  },
  // 1-5. 운영서버 설정
  {
    id: 22,
    step: '1-22',
    task: '운영서버 권한 설정',
    section: '구축 및 설치',
    subsection: '운영서버 설정',
    status: 'pending',
    role: 'field',
  },
  {
    id: 23,
    step: '1-23',
    task: '운영서버 사용자 설정',
    section: '구축 및 설치',
    subsection: '운영서버 설정',
    status: 'pending',
    role: 'field',
  },
  {
    id: 24,
    step: '1-24',
    task: '운영서버 데이터 정책 관리 설정',
    section: '구축 및 설치',
    subsection: '운영서버 설정',
    status: 'pending',
    role: 'field',
  },
  {
    id: 25,
    step: '1-25',
    task: '지자체 로고 파일 준비',
    section: '구축 및 설치',
    subsection: '운영서버 설정',
    status: 'pending',
    role: 'rnd',
  },
  {
    id: 26,
    step: '1-26',
    task: '트래커 EUI LIST 확인',
    section: '구축 및 설치',
    subsection: '운영서버 설정',
    status: 'pending',
    role: 'field',
  },
  {
    id: 27,
    step: '1-27',
    task: '운영서버 운영사 관리 설정',
    section: '구축 및 설치',
    subsection: '운영서버 설정',
    status: 'pending',
    role: 'field',
  },
  {
    id: 28,
    step: '1-28',
    task: '운영서버 센서 공급사 설정',
    section: '구축 및 설치',
    subsection: '운영서버 설정',
    status: 'pending',
    role: 'field',
  },
  {
    id: 29,
    step: '1-29',
    task: '운영서버 센서 마스터 관리 설정',
    section: '구축 및 설치',
    subsection: '운영서버 설정',
    status: 'pending',
    role: 'field',
  },
  {
    id: 30,
    step: '1-30',
    task: '운영서버 현장-센서 권한 관리 설정',
    section: '구축 및 설치',
    subsection: '운영서버 설정',
    status: 'pending',
    role: 'field',
  },
  // 1-6. 운영서버 데이터 등록
  {
    id: 31,
    step: '1-31',
    task: '현장 관리 - 도면 세팅',
    section: '구축 및 설치',
    subsection: '운영서버 데이터 등록',
    status: 'pending',
    role: 'rnd',
  },
  {
    id: 32,
    step: '1-32',
    task: '현장 관리 - 현장 등록',
    section: '구축 및 설치',
    subsection: '운영서버 데이터 등록',
    status: 'pending',
    role: 'field',
  },
  {
    id: 33,
    step: '1-33',
    task: '비콘 관리 - 비콘 등록',
    section: '구축 및 설치',
    subsection: '운영서버 데이터 등록',
    status: 'pending',
    role: 'field',
  },
  {
    id: 34,
    step: '1-34',
    task: '트래커 관리 - 트래커 등록',
    section: '구축 및 설치',
    subsection: '운영서버 데이터 등록',
    status: 'pending',
    role: 'field',
  },
  {
    id: 35,
    step: '1-35',
    task: '이동형중계기 관리 - 이동형중계기 등록',
    section: '구축 및 설치',
    subsection: '운영서버 데이터 등록',
    status: 'pending',
    role: 'field',
  },
  {
    id: 36,
    step: '1-36',
    task: '센서 관리 - 워치 등록',
    section: '구축 및 설치',
    subsection: '운영서버 데이터 등록',
    status: 'pending',
    role: 'field',
  },
  {
    id: 37,
    step: '1-37',
    task: '센서 관리 - 이동가스검침기 등록',
    section: '구축 및 설치',
    subsection: '운영서버 데이터 등록',
    status: 'pending',
    role: 'field',
  },
  {
    id: 38,
    step: '1-38',
    task: '알림 관리 - 알림 등록',
    section: '구축 및 설치',
    subsection: '운영서버 데이터 등록',
    status: 'pending',
    role: 'field',
  },
  {
    id: 39,
    step: '1-39',
    task: '작업자 관리 - 작업자 등록',
    section: '구축 및 설치',
    subsection: '운영서버 데이터 등록',
    status: 'pending',
    role: 'field',
  },
  {
    id: 40,
    step: '1-40',
    task: '작업자 관리 - 트래커/센서 교부',
    section: '구축 및 설치',
    subsection: '운영서버 데이터 등록',
    status: 'pending',
    role: 'field',
  },
  {
    id: 41,
    step: '1-41',
    task: '위험성 평가 관리 - 위험성 평가 등록',
    section: '구축 및 설치',
    subsection: '운영서버 데이터 등록',
    status: 'pending',
    role: 'field',
  },
  {
    id: 42,
    step: '1-42',
    task: '작업 관리 - 작업 등록',
    section: '구축 및 설치',
    subsection: '운영서버 데이터 등록',
    status: 'pending',
    role: 'field',
  },
  {
    id: 43,
    step: '1-43',
    task: '증빙자료 관리 - 증빙자료 13항 카테고리 등록',
    section: '구축 및 설치',
    subsection: '운영서버 데이터 등록',
    status: 'pending',
    role: 'rnd',
  },
  // 1-7. 현장 설치
  {
    id: 44,
    step: '1-44',
    task: '비콘 설치',
    section: '구축 및 설치',
    subsection: '현장 설치',
    status: 'pending',
    role: 'field',
  },
  {
    id: 45,
    step: '1-45',
    task: '지오 펜스 & 셀 플래닝',
    section: '구축 및 설치',
    subsection: '현장 설치',
    status: 'pending',
    role: 'field',
  },
  {
    id: 46,
    step: '1-46',
    task: '트래커 스마트 워치 MAC 매핑',
    section: '구축 및 설치',
    subsection: '현장 설치',
    status: 'pending',
    role: 'field',
  },
  {
    id: 47,
    step: '1-47',
    task: '스마트 워치 APP 설치',
    section: '구축 및 설치',
    subsection: '현장 설치',
    status: 'pending',
    role: 'field',
    startDate: '2024-12-16',
    completionDate: '2024-12-19',
  },

  // 2. 대시보드 필드 테스트
  {
    id: 48,
    step: '2-01',
    task: '사업소 명 확인',
    section: '대시보드 필드 테스트',
    subsection: null,
    status: 'pending',
    role: 'both',
  },
  {
    id: 49,
    step: '2-02',
    task: '날짜 확인',
    section: '대시보드 필드 테스트',
    subsection: null,
    status: 'pending',
    role: 'both',
  },
  {
    id: 50,
    step: '2-03',
    task: '날씨 데이터 확인',
    section: '대시보드 필드 테스트',
    subsection: null,
    status: 'pending',
    role: 'both',
  },
  {
    id: 51,
    step: '2-04',
    task: '작업자 데이터 확인',
    section: '대시보드 필드 테스트',
    subsection: null,
    status: 'pending',
    role: 'both',
  },
  {
    id: 52,
    step: '2-05',
    task: '작업 목록 데이터 확인',
    section: '대시보드 필드 테스트',
    subsection: null,
    status: 'pending',
    role: 'both',
  },
  {
    id: 53,
    step: '2-06',
    task: '고정형 비콘 데이터 확인',
    section: '대시보드 필드 테스트',
    subsection: null,
    status: 'pending',
    role: 'both',
  },
  {
    id: 54,
    step: '2-07',
    task: '트래커 데이터 확인',
    section: '대시보드 필드 테스트',
    subsection: null,
    status: 'pending',
    role: 'both',
  },
  {
    id: 55,
    step: '2-08',
    task: '워치 데이터 확인',
    section: '대시보드 필드 테스트',
    subsection: null,
    status: 'pending',
    role: 'both',
  },
  {
    id: 56,
    step: '2-09',
    task: '이동형 가스검침기 데이터 확인',
    section: '대시보드 필드 테스트',
    subsection: null,
    status: 'pending',
    role: 'both',
  },
  {
    id: 57,
    step: '2-10',
    task: '이동형 중계기 데이터 확인',
    section: '대시보드 필드 테스트',
    subsection: null,
    status: 'pending',
    role: 'both',
  },
  {
    id: 58,
    step: '2-11',
    task: '고정가스 검침기 데이터 확인',
    section: '대시보드 필드 테스트',
    subsection: null,
    status: 'pending',
    role: 'both',
  },
  {
    id: 59,
    step: '2-12',
    task: '배터리 및 상태 이상 IoT 센서 현황 데이터 확인',
    section: '대시보드 필드 테스트',
    subsection: null,
    status: 'pending',
    role: 'both',
  },
  {
    id: 60,
    step: '2-13',
    task: '위급 상황 현황 데이터 확인',
    section: '대시보드 필드 테스트',
    subsection: null,
    status: 'pending',
    role: 'both',
  },

  // 3. 준공 및 문서
  {
    id: 61,
    step: '3-01',
    task: '현장 VOC 점검 리스트 확인',
    section: '준공 및 문서',
    subsection: null,
    status: 'pending',
    role: 'both',
  },
  {
    id: 62,
    step: '3-02',
    task: '메뉴얼 문서 작업',
    section: '준공 및 문서',
    subsection: null,
    status: 'pending',
    role: 'field',
  },
  {
    id: 63,
    step: '3-03',
    task: '준공 문서 제출',
    section: '준공 및 문서',
    subsection: null,
    status: 'pending',
    role: 'field',
  },
  {
    id: 64,
    step: '3-04',
    task: 'H/W, S/W 제품 사용 교육',
    section: '준공 및 문서',
    subsection: null,
    status: 'pending',
    role: 'field',
  },
  {
    id: 65,
    step: '3-05',
    task: '사업소에 제품 배포 및 수량 확인',
    section: '준공 및 문서',
    subsection: null,
    status: 'pending',
    role: 'field',
  },
  {
    id: 66,
    step: '3-06',
    task: '준공 검수',
    section: '준공 및 문서',
    subsection: null,
    status: 'pending',
    role: 'field',
  },
  {
    id: 67,
    step: '3-07',
    task: '준공 완료',
    section: '준공 및 문서',
    subsection: null,
    status: 'pending',
    role: 'both',
  },
];

// 초기 체크리스트 데이터
const getInitialChecklist = () => [
  {
    id: 1,
    text: '위급상황(심박위험, 유해가스위험, SOS신호), 위험작업(위험 작업), 현재 작업자 현황(잔류 작업자 수, 전체 입실자 수, 전체 퇴실자 수)',
    checked: true,
  },
  {
    id: 2,
    text: '작업자가 트래커를 착용해서 위치비콘이 설치된 곳에 위치하면 대시보드에 착용자의 위치가 출력되는가',
    checked: true,
  },
  {
    id: 3,
    text: '작업자의 이름, 위치, 심박수, 가스정보(이동형 가스검지기) 등 데이터가 대시보드에 출력되는가',
    checked: true,
  },
  {
    id: 4,
    text: '작업자목록에서 작업자의 행을 클릭하였을 때 작업자의 동선이력이 대시보드에 출력되는가',
    checked: true,
  },
  {
    id: 5,
    text: '배터리 및 상태 이상 IoT 센서 현황으로 장비명(IoT 센서로 명칭 그룹화), 위치, 배터리가 대시보드에 출력되는가',
    checked: false,
  },
  {
    id: 6,
    text: '위급상황 현황으로 작업자, 위치, 위급상황, 발생시간이 대시보드에 출력되는가',
    checked: true,
  },
  {
    id: 7,
    text: '작업목록에서 작업명, 위험도, 위치, 작업자 수, 작업예정일시 및 시작일시, 작업종료일시 작업상태가 대시보드에 출력되는가',
    checked: false,
  },
  {
    id: 8,
    text: '고정형비콘목록에서 비콘 이름, Major Minor, 위치, 배터리가 대시보드에 출력되는가',
    checked: true,
  },
  {
    id: 9,
    text: '트래커목록에서 트래커 이름, 작업자명, 배터리, 사용여부, SOS-ON, 발생시간이 대시보드에 출력되는가',
    checked: true,
  },
  {
    id: 10,
    text: '워치목록에서 워치 이름, 작업자명, 심박수, 배터리, 사용여부, 발생시간이 대시보드에 출력되는가',
    checked: true,
  },
  {
    id: 11,
    text: '이동형 가스검지기 목록에서 가스센서 이름, 작업자명, 5종가스데이터(CO, CO2, H2S, O2, LEL), 배터리, 사용여부, 발생시간이 대시보드에 출력되는가',
    checked: true,
  },
  {
    id: 12,
    text: '위치이력, 워치 및 가스센서 이력, 알림이력이 조회 및 백업 데이터로 엑셀파일 생성이 가능한가',
    checked: true,
  },
  {
    id: 13,
    text: '위험 알림 발생 시(심박수, 유해가스 허용범위를 넘어설 경우,SOS 신호 등), 어느화면에서든 위험 알림 팝업이 출력되는가',
    checked: true,
  },
  {
    id: 14,
    text: '위험 알림 발생 시 안전관리자의 스마트폰에 SOS 팝업 정보 문자 메세지가 자동 & 수동으로 전달되는가',
    checked: true,
  },
  {
    id: 15,
    text: '운영서버에서 개인별로 매핑된 갤럭시 워치의 심박수를 최소,최대로 조절이 가능한가',
    checked: true,
  },
  {
    id: 16,
    text: '입/퇴사자 발생시 작업자 계정 생성/삭제와 트래커, 갤럭시 워치, 휴대용 가스검지기가 매핑되는가',
    checked: true,
  },
  {
    id: 17,
    text: '해당 위치에 설치된 고정형 가스검침기의 가스데이터(2종, O2와 H2S)가 대시보드에 출력되는가',
    checked: true,
  },
  {
    id: 18,
    text: '고정형 가스 검지기에서 허용범위를 넘어설 경우 대시보드에 빨간색으로 위험신호로 표시가 되는가',
    checked: true,
  },
  {
    id: 19,
    text: '고정형 가스 검지기에서 허용범위를 넘어설 경우 알림을 표시하고 관리자에게 문자로 전송되는가',
    checked: true,
  },
];

// 100% 완료된 타임라인 데이터 생성
const getCompletedTimeline = () => {
  return getInitialTimeline().map((item) => ({
    ...item,
    status: 'completed',
    completedAt: item.completedAt || '2025-12-15T10:00:00Z',
  }));
};

// 100% 완료된 체크리스트 데이터 생성
const getCompletedChecklist = () => {
  return getInitialChecklist().map((item) => ({
    ...item,
    checked: true,
  }));
};

// 초기 데이터 구조
const getInitialData = () => ({
  sites: [
    {
      id: 'anyang-bakdal',
      name: '안양 박달 사업소',
      timeline: getInitialTimeline(),
      checklist: getInitialChecklist(),
    },
    {
      id: 'icheon-public-sewer',
      name: '이천 공공 하수도 사업소',
      timeline: getCompletedTimeline(),
      checklist: getCompletedChecklist(),
    },
    {
      id: 'gunpo-sewer',
      name: '군포 하수도 사업소',
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
      for (const newItem of newChecklist) {
        const existingItem = checklist.find(
          (item) => item.id === newItem.id || item.text === newItem.text
        );
        if (existingItem) {
          newItem.checked = existingItem.checked;
        }
      }
    }
    return newChecklist;
  }

  // id가 1-19 범위를 벗어나는 항목이 있으면 제거
  const validIds = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  const hasInvalidId = checklist.some((item) => !validIds.has(item.id));
  if (hasInvalidId) {
    return checklist.filter((item) => validIds.has(item.id));
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
          if (data?.sites && Array.isArray(data.sites)) {
            sites = data.sites;
          } else if (Array.isArray(data)) {
            sites = data;
          } else {
            throw new Error('Invalid API response format');
          }

          // 체크리스트 검증 및 업데이트
          sites = sites.map((site) => ({
            ...site,
            checklist: validateAndUpdateChecklist(site.checklist),
          }));

          // 초기 데이터와 병합 (초기 데이터의 프로젝트가 API에 없으면 추가)
          const initialData = getInitialData();
          const initialSiteIds = new Set(sites.map((s) => s.id));
          const missingInitialSites = initialData.sites.filter((s) => !initialSiteIds.has(s.id));
          const mergedSites = [...sites, ...missingInitialSites];

          set({ sites: mergedSites, loading: false });
          return { sites: mergedSites };
        } catch (error) {
          console.error('Failed to load data from API:', error);
          // API 실패 시 초기 데이터 사용 (새로 추가한 프로젝트 포함)
          const initialData = getInitialData();
          // 기존 캐시된 데이터와 초기 데이터를 병합 (초기 데이터 우선)
          const cachedSites = get().sites;
          if (cachedSites && cachedSites.length > 0) {
            // 초기 데이터의 프로젝트 ID 목록
            const initialSiteIds = new Set(initialData.sites.map((s) => s.id));
            // 캐시된 데이터 중 초기 데이터에 없는 프로젝트는 유지
            const mergedSites = [
              ...initialData.sites,
              ...cachedSites.filter((s) => !initialSiteIds.has(s.id)),
            ];
            set({ sites: mergedSites, loading: false, error: null });
            return { sites: mergedSites };
          }
          // 캐시도 없으면 초기 데이터 반환
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
          if (siteData?.id) {
            site = siteData;
          } else if (siteData?.site) {
            site = siteData.site;
          } else {
            throw new Error('Invalid API response format');
          }

          // 체크리스트 검증
          site.checklist = validateAndUpdateChecklist(site.checklist);

          // 스토어에 업데이트
          const currentSites = get().sites;
          const siteIndex = currentSites.findIndex((s) => s.id === siteId);

          if (siteIndex !== -1) {
            set({
              sites: currentSites.map((s, idx) => (idx === siteIndex ? site : s)),
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
          const cachedSite = get().sites.find((s) => s.id === siteId);
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
        const site = currentSites.find((s) => s.id === siteId);

        if (!site) {
          console.error('Site not found:', siteId);
          return null;
        }

        const itemIndex = site.timeline.findIndex((item) => item.id === itemId);
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

        const updatedSites = currentSites.map((s) => (s.id === siteId ? updatedSite : s));
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
        const site = currentSites.find((s) => s.id === siteId);

        if (!site) {
          console.error('Site not found:', siteId);
          return null;
        }

        const itemIndex = site.checklist.findIndex((item) => item.id === itemId);
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

        const updatedSites = currentSites.map((s) => (s.id === siteId ? updatedSite : s));
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
        const site = get().sites.find((s) => s.id === siteId);
        if (!site) return { timeline: 0, checklist: 0, overall: 0, working: 0, completed: 0 };

        // 타임라인 진행도 (completed만 100%로 계산, working은 표시만)
        const timelineTotal = site.timeline.length;
        const timelineCompleted = site.timeline.filter(
          (item) => item.status === 'completed'
        ).length;
        const timelineWorking = site.timeline.filter((item) => item.status === 'working').length;
        // 완료된 항목만 진행도에 포함
        const timelineProgress = (timelineCompleted / timelineTotal) * 100;

        // 체크리스트 진행도
        const checklistTotal = site.checklist.length;
        const checklistCompleted = site.checklist.filter((item) => item.checked).length;
        const checklistProgress = (checklistCompleted / checklistTotal) * 100;

        // 전체 진행도 (타임라인 70%, 체크리스트 30%)
        const overallProgress = timelineProgress * 0.7 + checklistProgress * 0.3;

        return {
          timeline: Math.round(timelineProgress),
          checklist: Math.round(checklistProgress),
          overall: Math.round(overallProgress),
          // 추가 정보: 완료 및 진행중 개수 (차트 표시용)
          working: timelineWorking,
          completed: timelineCompleted,
          total: timelineTotal,
        };
      },

      // 사업소 데이터 가져오기 (동기)
      getSite: (siteId) => {
        return get().sites.find((site) => site.id === siteId) || null;
      },
    }),
    {
      name: STORAGE_KEY,
      // persist 옵션: sites만 저장
      partialize: (state) => ({ sites: state.sites }),
      // localStorage에서 복원할 때 초기 데이터의 프로젝트들이 항상 포함되도록 함
      onRehydrateStorage: () => (state) => {
        if (state) {
          const initialData = getInitialData();
          const initialSiteIds = new Set(state.sites.map((s) => s.id));
          const missingInitialSites = initialData.sites.filter((s) => !initialSiteIds.has(s.id));
          if (missingInitialSites.length > 0) {
            state.sites = [...state.sites, ...missingInitialSites];
          }
        }
      },
    }
  )
);
