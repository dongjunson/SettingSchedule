import * as XLSX from 'xlsx';

/**
 * 타임라인 데이터를 엑셀 파일로 내보내기
 * @param {Object} site - 사이트 데이터 (name, timeline 포함)
 */
export function exportTimelineToExcel(site) {
  if (!site || !site.timeline) {
    console.error('No site data to export');
    return;
  }

  // 헤더 행
  const headers = ['단계', '세부단계', '태스크명', '시작날짜', '완료날짜'];

  // 날짜 포맷팅 (MM.DD 형식)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      // yyyy-MM-dd 형식 처리
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

  // 섹션별로 그룹화
  const sections = [...new Set(site.timeline.map((item) => item.section))];

  for (const section of sections) {
    const sectionItems = site.timeline.filter((item) => item.section === section);

    // 서브섹션별로 그룹화 (subsection 또는 subSection 지원)
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
        // 태스크명: task 또는 title 지원
        const taskName = item.task || item.title || '';

        rows.push([
          isFirstInSection ? section : '', // 단계 (섹션 첫 번째 항목에만 표시)
          isFirstInSubSection ? subSection || '' : '', // 세부단계 (서브섹션 첫 번째 항목에만 표시)
          taskName, // 태스크명
          formatDate(item.startDate), // 시작날짜
          formatDate(item.completionDate), // 완료날짜
        ]);

        isFirstInSection = false;
        isFirstInSubSection = false;
      }
    }
  }

  // 워크시트 생성
  const ws = XLSX.utils.aoa_to_sheet([
    [site.name], // 사업소 이름
    [], // 빈 행
    headers, // 헤더
    ...rows, // 데이터
  ]);

  // 열 너비 설정
  ws['!cols'] = [
    { wch: 15 }, // 단계
    { wch: 20 }, // 세부단계
    { wch: 60 }, // 태스크명
    { wch: 12 }, // 시작날짜
    { wch: 12 }, // 완료날짜
  ];

  // 셀 병합 설정 (사업소 이름)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // A1:E1 병합
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

  // 헤더 행
  const headers = ['번호', '항목', '체크 여부'];

  // 데이터 행 생성
  const rows = site.checklist.map((item) => [
    String(item.id).padStart(2, '0'), // 번호
    item.text || '', // 항목
    item.checked ? '체크됨' : '체크 안됨', // 체크 여부
  ]);

  // 진행도 정보 계산
  const completedCount = site.checklist.filter((item) => item.checked).length;
  const totalCount = site.checklist.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 워크시트 생성
  const ws = XLSX.utils.aoa_to_sheet([
    [site.name], // 사업소 이름
    [`진행도: ${completedCount} / ${totalCount} 항목 완료 (${progress}%)`], // 진행도 정보
    [
      `출력일: ${new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
    ], // 출력일
    [], // 빈 행
    headers, // 헤더
    ...rows, // 데이터
  ]);

  // 열 너비 설정
  ws['!cols'] = [
    { wch: 10 }, // 번호
    { wch: 80 }, // 항목
    { wch: 15 }, // 체크 여부
  ];

  // 셀 병합 설정
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // A1:C1 병합 (사업소 이름)
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }, // A2:C2 병합 (진행도)
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } }, // A3:C3 병합 (출력일)
  ];

  // 워크북 생성
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '점검리스트');

  // 파일 다운로드
  const fileName = `${site.name}_점검리스트_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
