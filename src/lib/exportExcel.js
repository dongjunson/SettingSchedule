import * as XLSX from 'xlsx-js-style';

// 공통 스타일 정의
const styles = {
  // 메인 타이틀
  title: {
    font: { bold: true, sz: 18, color: { rgb: '1F2937' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    fill: { fgColor: { rgb: 'E0E7FF' } },
  },
  // 서브 타이틀 (출력일)
  subtitle: {
    font: { sz: 10, color: { rgb: '6B7280' } },
    alignment: { horizontal: 'center', vertical: 'center' },
  },
  // 섹션 헤더 (기본 정보, 요약 등)
  sectionHeader: {
    font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '3B82F6' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '2563EB' } },
      bottom: { style: 'thin', color: { rgb: '2563EB' } },
      left: { style: 'thin', color: { rgb: '2563EB' } },
      right: { style: 'thin', color: { rgb: '2563EB' } },
    },
  },
  // 매출 섹션 헤더
  salesSectionHeader: {
    font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '10B981' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '059669' } },
      bottom: { style: 'thin', color: { rgb: '059669' } },
      left: { style: 'thin', color: { rgb: '059669' } },
      right: { style: 'thin', color: { rgb: '059669' } },
    },
  },
  // 지출 섹션 헤더
  expenseSectionHeader: {
    font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: 'F97316' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'EA580C' } },
      bottom: { style: 'thin', color: { rgb: 'EA580C' } },
      left: { style: 'thin', color: { rgb: 'EA580C' } },
      right: { style: 'thin', color: { rgb: 'EA580C' } },
    },
  },
  // 테이블 헤더
  tableHeader: {
    font: { bold: true, sz: 10, color: { rgb: '374151' } },
    fill: { fgColor: { rgb: 'F3F4F6' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'D1D5DB' } },
      bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
      left: { style: 'thin', color: { rgb: 'D1D5DB' } },
      right: { style: 'thin', color: { rgb: 'D1D5DB' } },
    },
  },
  // 일반 셀
  cell: {
    font: { sz: 10, color: { rgb: '374151' } },
    alignment: { vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'E5E7EB' } },
      bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
      left: { style: 'thin', color: { rgb: 'E5E7EB' } },
      right: { style: 'thin', color: { rgb: 'E5E7EB' } },
    },
  },
  // 숫자 셀 (오른쪽 정렬)
  numberCell: {
    font: { sz: 10, color: { rgb: '374151' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'E5E7EB' } },
      bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
      left: { style: 'thin', color: { rgb: 'E5E7EB' } },
      right: { style: 'thin', color: { rgb: 'E5E7EB' } },
    },
  },
  // 퍼센트 셀 (중앙 정렬)
  percentCell: {
    font: { sz: 10, color: { rgb: '6B7280' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'E5E7EB' } },
      bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
      left: { style: 'thin', color: { rgb: 'E5E7EB' } },
      right: { style: 'thin', color: { rgb: 'E5E7EB' } },
    },
  },
  // 합계 행
  totalRow: {
    font: { bold: true, sz: 10, color: { rgb: '1F2937' } },
    fill: { fgColor: { rgb: 'FEF3C7' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
      top: { style: 'medium', color: { rgb: 'F59E0B' } },
      bottom: { style: 'medium', color: { rgb: 'F59E0B' } },
      left: { style: 'thin', color: { rgb: 'F59E0B' } },
      right: { style: 'thin', color: { rgb: 'F59E0B' } },
    },
  },
  // 요약 라벨
  summaryLabel: {
    font: { sz: 10, color: { rgb: '6B7280' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'E5E7EB' } },
      bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
      left: { style: 'thin', color: { rgb: 'E5E7EB' } },
      right: { style: 'thin', color: { rgb: 'E5E7EB' } },
    },
  },
  // 요약 값 (양수 - 파란색)
  summaryValuePositive: {
    font: { bold: true, sz: 11, color: { rgb: '2563EB' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'E5E7EB' } },
      bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
      left: { style: 'thin', color: { rgb: 'E5E7EB' } },
      right: { style: 'thin', color: { rgb: 'E5E7EB' } },
    },
  },
  // 요약 값 (지출 - 주황색)
  summaryValueExpense: {
    font: { bold: true, sz: 11, color: { rgb: 'EA580C' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'E5E7EB' } },
      bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
      left: { style: 'thin', color: { rgb: 'E5E7EB' } },
      right: { style: 'thin', color: { rgb: 'E5E7EB' } },
    },
  },
  // 요약 값 (손익 - 초록색)
  summaryValueProfit: {
    font: { bold: true, sz: 11, color: { rgb: '059669' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'E5E7EB' } },
      bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
      left: { style: 'thin', color: { rgb: 'E5E7EB' } },
      right: { style: 'thin', color: { rgb: 'E5E7EB' } },
    },
  },
  // 중분류 카테고리
  categoryCell: {
    font: { bold: true, sz: 10, color: { rgb: '4B5563' } },
    fill: { fgColor: { rgb: 'F9FAFB' } },
    alignment: { vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'E5E7EB' } },
      bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
      left: { style: 'thin', color: { rgb: 'E5E7EB' } },
      right: { style: 'thin', color: { rgb: 'E5E7EB' } },
    },
  },
};

/**
 * 손익계산서 데이터를 엑셀 파일로 내보내기
 * @param {Object} data - 손익계산서 데이터
 * @param {string} data.siteName - 사업소명
 * @param {Object} data.header - 헤더 데이터 (expectedAmount, contractAmount)
 * @param {Array} data.salesItems - 매출 항목 배열
 * @param {Array} data.expenseItems - 지출 항목 배열 (변동비)
 * @param {Object} data.totals - 합계 정보 (salesTotal, variableExpenseTotal, fieldOpsExpenseTotal, expenseTotal, profit, profitRate)
 */
export function exportIncomeStatementToExcel(data) {
  const { siteName, header, salesItems, expenseItems, totals } = data;

  if (!siteName) {
    console.error('No site name provided');
    return;
  }

  const formatNumber = (value) => {
    if (value == null || Number.isNaN(value)) return '-';
    return value.toLocaleString('ko-KR');
  };

  const formatPercent = (value) => {
    if (value == null || Number.isNaN(value)) return '-';
    return `${value.toFixed(1)}%`;
  };

  // 워크시트 데이터 구성
  const rows = [];
  const styleMap = []; // 각 행의 스타일 정보

  // 제목
  rows.push([`${siteName} 손익계산서`, '', '', '', '', '']);
  styleMap.push(['title', 'title', 'title', 'title', 'title', 'title']);

  rows.push([
    `출력일: ${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    '',
    '',
    '',
    '',
  ]);
  styleMap.push(['subtitle', 'subtitle', 'subtitle', 'subtitle', 'subtitle', 'subtitle']);

  rows.push(['', '', '', '', '', '']);
  styleMap.push([null, null, null, null, null, null]);

  // 기본 정보
  rows.push(['📋 기본 정보', '', '', '', '', '']);
  styleMap.push([
    'sectionHeader',
    'sectionHeader',
    'sectionHeader',
    'sectionHeader',
    'sectionHeader',
    'sectionHeader',
  ]);

  rows.push([
    '가예상금액',
    `${formatNumber(Number(header.expectedAmount || 0))}원`,
    '',
    '',
    '',
    '',
  ]);
  styleMap.push(['summaryLabel', 'summaryValuePositive', null, null, null, null]);

  rows.push(['계약금액', `${formatNumber(Number(header.contractAmount || 0))}원`, '', '', '', '']);
  styleMap.push(['summaryLabel', 'summaryValuePositive', null, null, null, null]);

  rows.push(['', '', '', '', '', '']);
  styleMap.push([null, null, null, null, null, null]);

  // 요약
  rows.push(['📊 요약', '', '', '', '', '']);
  styleMap.push([
    'sectionHeader',
    'sectionHeader',
    'sectionHeader',
    'sectionHeader',
    'sectionHeader',
    'sectionHeader',
  ]);

  rows.push(['매출 합계', `${formatNumber(totals.salesTotal)}원`, '', '', '', '']);
  styleMap.push(['summaryLabel', 'summaryValuePositive', null, null, null, null]);

  rows.push(['지출 합계', `${formatNumber(totals.expenseTotal)}원`, '', '', '', '']);
  styleMap.push(['summaryLabel', 'summaryValueExpense', null, null, null, null]);

  rows.push(['  └ 변동비', `${formatNumber(totals.variableExpenseTotal)}원`, '', '', '', '']);
  styleMap.push(['summaryLabel', 'numberCell', null, null, null, null]);

  rows.push(['  └ 현장 운영비', `${formatNumber(totals.fieldOpsExpenseTotal)}원`, '', '', '', '']);
  styleMap.push(['summaryLabel', 'numberCell', null, null, null, null]);

  rows.push(['손익', `${formatNumber(totals.profit)}원`, '', '', '', '']);
  styleMap.push(['summaryLabel', 'summaryValueProfit', null, null, null, null]);

  rows.push(['수익률', formatPercent(totals.profitRate), '', '', '', '']);
  styleMap.push(['summaryLabel', 'summaryValueProfit', null, null, null, null]);

  rows.push(['', '', '', '', '', '']);
  styleMap.push([null, null, null, null, null, null]);

  // 매출 항목
  rows.push(['💰 매출 항목', '', '', '', '', '']);
  styleMap.push([
    'salesSectionHeader',
    'salesSectionHeader',
    'salesSectionHeader',
    'salesSectionHeader',
    'salesSectionHeader',
    'salesSectionHeader',
  ]);

  rows.push(['항목명', '금액', '손익대비', '매출 내', '비고', '']);
  styleMap.push(['tableHeader', 'tableHeader', 'tableHeader', 'tableHeader', 'tableHeader', null]);

  for (const item of salesItems) {
    const amount = Number(item.amount || 0);
    const profitRatio = totals.profit ? (amount / totals.profit) * 100 : 0;
    const salesRatio = totals.salesTotal ? (amount / totals.salesTotal) * 100 : 0;
    rows.push([
      item.name || '',
      `${formatNumber(amount)}원`,
      formatPercent(profitRatio),
      formatPercent(salesRatio),
      item.note || '',
      '',
    ]);
    styleMap.push(['cell', 'numberCell', 'percentCell', 'percentCell', 'cell', null]);
  }

  // 매출 합계
  rows.push(['합계', `${formatNumber(totals.salesTotal)}원`, '', '', '', '']);
  styleMap.push(['totalRow', 'totalRow', 'totalRow', 'totalRow', 'totalRow', null]);

  rows.push(['', '', '', '', '', '']);
  styleMap.push([null, null, null, null, null, null]);

  // 지출 항목 (변동비) - 중분류별로 그룹화
  rows.push(['📦 지출 - 변동비', '', '', '', '', '']);
  styleMap.push([
    'expenseSectionHeader',
    'expenseSectionHeader',
    'expenseSectionHeader',
    'expenseSectionHeader',
    'expenseSectionHeader',
    'expenseSectionHeader',
  ]);

  rows.push(['중분류', '항목명', '금액', '매출대비', '지출대비', '비고']);
  styleMap.push([
    'tableHeader',
    'tableHeader',
    'tableHeader',
    'tableHeader',
    'tableHeader',
    'tableHeader',
  ]);

  // 중분류별로 그룹화 (현장 운영비 제외)
  const categorizedExpenses = {};
  for (const item of expenseItems) {
    if (item.groupName !== 'field_ops') {
      const cat = item.category || '기타';
      if (!categorizedExpenses[cat]) categorizedExpenses[cat] = [];
      categorizedExpenses[cat].push(item);
    }
  }

  for (const [category, items] of Object.entries(categorizedExpenses)) {
    let isFirst = true;
    let categoryTotal = 0;

    for (const item of items) {
      const amount = Number(item.amount || 0);
      categoryTotal += amount;
      const salesRatio = totals.salesTotal
        ? (amount / Number(header.contractAmount || totals.salesTotal)) * 100
        : 0;
      const expenseRatio = totals.expenseTotal ? (amount / totals.expenseTotal) * 100 : 0;

      rows.push([
        isFirst ? category : '',
        item.name || '',
        `${formatNumber(amount)}원`,
        formatPercent(salesRatio),
        formatPercent(expenseRatio),
        item.note || '',
      ]);
      styleMap.push([
        isFirst ? 'categoryCell' : 'cell',
        'cell',
        'numberCell',
        'percentCell',
        'percentCell',
        'cell',
      ]);
      isFirst = false;
    }

    // 중분류 소계
    const catSalesRatio = totals.salesTotal
      ? (categoryTotal / Number(header.contractAmount || totals.salesTotal)) * 100
      : 0;
    const catExpenseRatio = totals.expenseTotal ? (categoryTotal / totals.expenseTotal) * 100 : 0;
    rows.push([
      '',
      `${category} 합계`,
      `${formatNumber(categoryTotal)}원`,
      formatPercent(catSalesRatio),
      formatPercent(catExpenseRatio),
      '',
    ]);
    styleMap.push(['totalRow', 'totalRow', 'totalRow', 'totalRow', 'totalRow', 'totalRow']);
  }

  // 변동비 총 합계
  rows.push(['변동비 합계', '', `${formatNumber(totals.variableExpenseTotal)}원`, '', '', '']);
  styleMap.push(['totalRow', 'totalRow', 'totalRow', 'totalRow', 'totalRow', 'totalRow']);

  rows.push(['', '', '', '', '', '']);
  styleMap.push([null, null, null, null, null, null]);

  // 현장 운영비
  const fieldOpsItems = expenseItems.filter((item) => item.groupName === 'field_ops');
  rows.push(['🏗️ 지출 - 현장 운영비', '', '', '', '', '']);
  styleMap.push([
    'expenseSectionHeader',
    'expenseSectionHeader',
    'expenseSectionHeader',
    'expenseSectionHeader',
    'expenseSectionHeader',
    'expenseSectionHeader',
  ]);

  rows.push(['지출 종류', '일자', '상세 내용', '금액', '', '']);
  styleMap.push(['tableHeader', 'tableHeader', 'tableHeader', 'tableHeader', null, null]);

  if (fieldOpsItems.length > 0) {
    for (const item of fieldOpsItems) {
      rows.push([
        item.paymentType || '',
        item.spentAt || '',
        item.description || '',
        `${formatNumber(Number(item.amount || 0))}원`,
        '',
        '',
      ]);
      styleMap.push(['cell', 'cell', 'cell', 'numberCell', null, null]);
    }
  }

  rows.push(['', '', '합계', `${formatNumber(totals.fieldOpsExpenseTotal)}원`, '', '']);
  styleMap.push(['totalRow', 'totalRow', 'totalRow', 'totalRow', null, null]);

  // 워크시트 생성
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // 스타일 적용
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const styleKey = styleMap[r]?.[c];
      if (styleKey && styles[styleKey] && ws[cellRef]) {
        ws[cellRef].s = styles[styleKey];
      }
    }
  }

  // 열 너비 설정
  ws['!cols'] = [
    { wch: 18 }, // A - 중분류/라벨
    { wch: 30 }, // B - 항목명/값
    { wch: 18 }, // C - 금액
    { wch: 12 }, // D - 매출대비
    { wch: 12 }, // E - 지출대비
    { wch: 20 }, // F - 비고
  ];

  // 행 높이 설정
  ws['!rows'] = rows.map((_, i) => {
    if (i === 0) return { hpt: 30 }; // 타이틀
    if (styleMap[i]?.[0]?.includes('Header')) return { hpt: 24 }; // 섹션 헤더
    return { hpt: 20 }; // 일반 행
  });

  // 셀 병합 설정
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // 타이틀
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // 출력일
    { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } }, // 기본 정보 헤더
    { s: { r: 8, c: 0 }, e: { r: 8, c: 5 } }, // 요약 헤더
  ];

  // 워크북 생성
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '손익계산서');

  // 파일 다운로드
  const fileName = `${siteName}_손익계산서_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * 타임라인 데이터를 엑셀 파일로 내보내기
 * @param {Object} site - 사이트 데이터 (name, timeline 포함)
 */
export function exportTimelineToExcel(site) {
  if (!site || !site.timeline) {
    console.error('No site data to export');
    return;
  }

  // 날짜 포맷팅 (MM.DD 형식)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [, month, day] = dateStr.split('-');
        return `${month}.${day}`;
      }
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return '';
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}.${day}`;
    } catch {
      return '';
    }
  };

  // 데이터 행 생성
  const rows = [];
  const styleMap = [];

  // 타이틀
  rows.push([site.name, '', '', '', '']);
  styleMap.push(['title', 'title', 'title', 'title', 'title']);

  rows.push([
    `출력일: ${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    '',
    '',
    '',
  ]);
  styleMap.push(['subtitle', 'subtitle', 'subtitle', 'subtitle', 'subtitle']);

  rows.push(['', '', '', '', '']);
  styleMap.push([null, null, null, null, null]);

  // 헤더
  rows.push(['단계', '세부단계', '태스크명', '시작날짜', '완료날짜']);
  styleMap.push(['tableHeader', 'tableHeader', 'tableHeader', 'tableHeader', 'tableHeader']);

  // 섹션별로 그룹화
  const sections = [...new Set(site.timeline.map((item) => item.section))];

  for (const section of sections) {
    const sectionItems = site.timeline.filter((item) => item.section === section);
    const subSections = [
      ...new Set(sectionItems.map((item) => item.subsection || item.subSection || '')),
    ];

    let isFirstInSection = true;

    for (const subSection of subSections) {
      const subSectionItems = sectionItems.filter(
        (item) => (item.subsection || item.subSection || '') === subSection
      );

      let isFirstInSubSection = true;

      for (const item of subSectionItems) {
        const taskName = item.task || item.title || '';

        rows.push([
          isFirstInSection ? section : '',
          isFirstInSubSection ? subSection || '' : '',
          taskName,
          formatDate(item.startDate),
          formatDate(item.completionDate),
        ]);
        styleMap.push([
          isFirstInSection ? 'categoryCell' : 'cell',
          isFirstInSubSection ? 'categoryCell' : 'cell',
          'cell',
          'cell',
          'cell',
        ]);

        isFirstInSection = false;
        isFirstInSubSection = false;
      }
    }
  }

  // 워크시트 생성
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // 스타일 적용
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const styleKey = styleMap[r]?.[c];
      if (styleKey && styles[styleKey] && ws[cellRef]) {
        ws[cellRef].s = styles[styleKey];
      }
    }
  }

  // 열 너비 설정
  ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 60 }, { wch: 12 }, { wch: 12 }];

  // 행 높이 설정
  ws['!rows'] = rows.map((_, i) => {
    if (i === 0) return { hpt: 28 };
    if (i === 3) return { hpt: 22 };
    return { hpt: 20 };
  });

  // 셀 병합 설정
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
  ];

  // 워크북 생성
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '타임라인');

  // 파일 다운로드
  const fileName = `${site.name}_타임라인_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * 점검리스트 데이터를 엑셀 파일로 내보내기
 * @param {Object} site - 사이트 데이터 (name, checklist 포함)
 */
export function exportChecklistToExcel(site) {
  if (!site || !site.checklist) {
    console.error('No checklist data to export');
    return;
  }

  // 진행도 정보 계산
  const completedCount = site.checklist.filter((item) => item.checked).length;
  const totalCount = site.checklist.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const rows = [];
  const styleMap = [];

  // 타이틀
  rows.push([site.name, '', '']);
  styleMap.push(['title', 'title', 'title']);

  rows.push([`진행도: ${completedCount} / ${totalCount} 항목 완료 (${progress}%)`, '', '']);
  styleMap.push(['subtitle', 'subtitle', 'subtitle']);

  rows.push([
    `출력일: ${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    '',
  ]);
  styleMap.push(['subtitle', 'subtitle', 'subtitle']);

  rows.push(['', '', '']);
  styleMap.push([null, null, null]);

  // 헤더
  rows.push(['번호', '항목', '체크 여부']);
  styleMap.push(['tableHeader', 'tableHeader', 'tableHeader']);

  // 데이터 행 생성
  for (let index = 0; index < site.checklist.length; index++) {
    const item = site.checklist[index];
    rows.push([
      String(index + 1).padStart(2, '0'),
      item.text || '',
      item.checked ? '✓ 완료' : '미완료',
    ]);
    styleMap.push(['cell', 'cell', item.checked ? 'summaryValueProfit' : 'cell']);
  }

  // 워크시트 생성
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // 스타일 적용
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const styleKey = styleMap[r]?.[c];
      if (styleKey && styles[styleKey] && ws[cellRef]) {
        ws[cellRef].s = styles[styleKey];
      }
    }
  }

  // 열 너비 설정
  ws['!cols'] = [{ wch: 10 }, { wch: 80 }, { wch: 15 }];

  // 행 높이 설정
  ws['!rows'] = rows.map((_, i) => {
    if (i === 0) return { hpt: 28 };
    if (i === 4) return { hpt: 22 };
    return { hpt: 20 };
  });

  // 셀 병합 설정
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
  ];

  // 워크북 생성
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '점검리스트');

  // 파일 다운로드
  const fileName = `${site.name}_점검리스트_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
