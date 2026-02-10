// 손익계산서 관련 상수 및 기본 데이터 빌더
// IncomeStatementManagePage에서 분리하여 재사용성 확보

import { createRowId } from './numberUtils';

export const DEFAULT_SALES_ITEMS = ['선금', '잔금'];

export const PAYMENT_TYPES = [
  '카드',
  '현금',
  '배달의민족',
  '쿠팡이츠',
  '요기요',
  '제로페이',
  '기타',
  '직접입력',
];

export const CUSTOM_PAYMENT_TYPE = '직접입력';

export const VARIABLE_EXPENSE_TEMPLATE = {
  수수료: ['실행이행보증보험료', '하자보증보험료', '조달청 시험'],
  이동통신료: ['중계기 LORA USIM', '태블릿 USIM', '모니터링시스템 USIM'],
  'H/W': [
    'Lora 중계기',
    'Lora 중계기 인프라비용',
    'VPN 서버',
    '스마트 워치',
    '스마트 비콘',
    '이동형 가스검측기',
    '고정형 가스검측기',
    '현장모니터링(태블릿)',
    '운영서버',
    '모니터링 시스템',
    '안전모,위치 거치대',
    '잡자재',
  ],
  'S/W': ['운영서버 S/W', '네트워크 S/W'],
  판관비: ['판관비'],
  영업비용: ['법률법인', '영업 활동비', '접대비'],
  인건비: ['현장투입인력 m/m'],
};

export const buildDefaultSalesItems = () =>
  DEFAULT_SALES_ITEMS.map((name, index) => ({
    id: createRowId(),
    type: 'sales',
    groupName: null,
    category: null,
    name,
    amount: '',
    note: '',
    orderIndex: index,
  }));

export const buildDefaultExpenseItems = () => {
  const items = [];
  let order = 0;
  for (const [category, names] of Object.entries(VARIABLE_EXPENSE_TEMPLATE)) {
    for (const name of names) {
      items.push({
        id: createRowId(),
        type: 'expense',
        groupName: 'variable',
        category,
        name,
        amount: '',
        note: '',
        orderIndex: order,
      });
      order += 1;
    }
  }
  return items;
};
