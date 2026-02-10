import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  FileSpreadsheet,
  ListChecks,
  LogOut,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProgressPieChart } from '../components/ProgressChart';
import { ErrorPage, LoadingSpinner } from '../components/common';
import { DesktopTimelineItem, TimelineRow } from '../components/timeline/TimelineItemCard';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';
import { toast } from '../hooks/use-toast';
import {
  calculateSiteProgress,
  useRepairSiteTimeline,
  useSite,
  useUpdateTimelineItem,
} from '../hooks/useQueries';
import { USER_GROUPS } from '../lib/constants';
import { exportTimelineToExcel } from '../lib/exportExcel';
import { useUserStore } from '../lib/userStore';
import { getNextStatus, parseStepForSort } from '../lib/utils';

export default function TimelinePage() {
  const { siteId } = useParams();
  const navigate = useNavigate();

  // React Query Hooks
  const { data: site, isLoading: loading } = useSite(siteId);
  const { mutateAsync: updateTimelineItem } = useUpdateTimelineItem();
  const { mutateAsync: repairSiteTimeline, isPending: repairing } = useRepairSiteTimeline();

  // 사용자 스토어
  const logout = useUserStore((state) => state.logout);
  const getId = useUserStore((state) => state.getId);
  const getGroup = useUserStore((state) => state.getGroup);
  const isAdmin = getGroup() === USER_GROUPS.ADMIN;

  // 아코디언 상태 관리
  const [expandedSubsections, setExpandedSubsections] = useState({});

  const toggleSubsection = (sectionIndex, subIndex) => {
    const key = `${sectionIndex}-${subIndex}`;
    setExpandedSubsections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllSubsectionsExpanded = (sectionIndex, subsectionCount, expanded) => {
    setExpandedSubsections((prev) => {
      const next = { ...prev };
      for (let i = 0; i < subsectionCount; i += 1) {
        next[`${sectionIndex}-${i}`] = Boolean(expanded);
      }
      return next;
    });
  };

  const isSubsectionExpanded = (sectionIndex, subIndex) => {
    const key = `${sectionIndex}-${subIndex}`;
    return expandedSubsections[key] !== false;
  };

  // ─── 이벤트 핸들러 ────────────────────────
  const handleStatusChange = async (itemId, currentStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    const updates = {
      status: nextStatus,
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : null,
      completedBy: nextStatus === 'completed' ? getId() || null : null,
    };
    try {
      await updateTimelineItem({ siteId, itemId, updates });
    } catch (err) {
      console.error('Failed to update timeline item:', err);
      toast({
        variant: 'destructive',
        title: '상태 변경 실패',
        description: '상태 변경에 실패했습니다.',
      });
    }
  };

  const handleDateChange = async (itemId, dates) => {
    const updates = {
      startDate: dates.startDate || null,
      completionDate: dates.completionDate || null,
    };
    try {
      await updateTimelineItem({ siteId, itemId, updates });
    } catch (err) {
      console.error('Failed to update timeline item dates:', err);
      toast({
        variant: 'destructive',
        title: '날짜 변경 실패',
        description: '날짜 변경에 실패했습니다.',
      });
    }
  };

  const handleRepairTimeline = async () => {
    if (!siteId) return;
    try {
      const res = await repairSiteTimeline(siteId);
      if (res?.inserted > 0) {
        toast({
          title: '복구 완료',
          description: `누락된 타임라인 ${res.inserted}개 항목을 복구했습니다.`,
        });
      } else {
        toast({ title: '확인 완료', description: '누락된 타임라인 항목이 없습니다.' });
      }
    } catch (err) {
      console.error('Failed to repair timeline:', err);
      toast({
        variant: 'destructive',
        title: '복구 실패',
        description: err?.message || '타임라인 복구에 실패했습니다.',
      });
    }
  };

  // ─── 렌더링 ───────────────────────────────
  const progress = site
    ? calculateSiteProgress(site)
    : { timeline: 0, checklist: 0, overall: 0, working: 0, completed: 0, total: 0 };

  if (loading) return <LoadingSpinner message="데이터를 불러오는 중입니다..." />;

  if (!site) {
    return (
      <ErrorPage
        title="프로젝트를 찾을 수 없습니다"
        message="요청하신 프로젝트가 존재하지 않거나 삭제되었습니다."
        onRetry={() => navigate('/')}
        retryText="프로젝트 목록으로"
      />
    );
  }

  // 정렬 및 섹션 추출
  const sortedTimeline = [...site.timeline].sort((a, b) => {
    const [a1, a2] = parseStepForSort(a.step);
    const [b1, b2] = parseStepForSort(b.step);
    return a1 !== b1 ? a1 - b1 : a2 - b2;
  });

  const sections = [];
  const sectionSeen = new Set();
  for (const item of sortedTimeline) {
    if (!sectionSeen.has(item.section)) {
      sectionSeen.add(item.section);
      sections.push(item.section);
    }
  }

  const ITEMS_PER_ROW = 3;

  const renderDesktopRows = (items) =>
    Array.from({ length: Math.ceil(items.length / ITEMS_PER_ROW) }).map((_, rowIndex) => {
      const rowItems = items.slice(rowIndex * ITEMS_PER_ROW, (rowIndex + 1) * ITEMS_PER_ROW);
      return (
        <TimelineRow
          key={`row-${rowItems[0]?.id || rowIndex}`}
          items={rowItems}
          onStatusChange={handleStatusChange}
          onDateChange={handleDateChange}
        />
      );
    });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 h-16">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              프로젝트 목록으로
            </Button>
            <div className="flex-shrink-0 flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={handleRepairTimeline}
                  disabled={repairing}
                  title="누락된 타임라인 항목을 템플릿 기준으로 복구"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {repairing ? '복구 중...' : '누락 복구'}
                </Button>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-muted/50 hover:bg-muted border-muted-foreground/20 hover:border-muted-foreground/40 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    data-tooltip-trigger
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end">
                  <div className="space-y-1">
                    <div className="font-semibold">{getId()}</div>
                    <div className="text-xs text-muted-foreground">그룹: {getGroup()}</div>
                    <div className="text-xs text-muted-foreground">클릭하여 로그아웃</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="flex flex-row items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <span className="w-1 h-8 bg-primary rounded-full" />
                {site.name} 프로젝트 타임라인
              </h1>
              <p className="text-muted-foreground ml-4 text-base">
                타임라인 항목을 클릭하여 상태를 변경할 수 있습니다
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate(`/site/${siteId}/checklist`)}
                className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                <ListChecks className="mr-2 h-4 w-4" />
                점검 리스트
              </Button>
              <Button variant="outline" onClick={() => exportTimelineToExcel(site)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                엑셀 출력
              </Button>
            </div>
          </div>

          {/* Progress Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <ProgressCard
              label="전체 진행도"
              value={progress.overall}
              color="rgb(59, 130, 246)"
              colorClass="text-primary"
              detail="전체 작업 진행률"
              name="전체"
            />
            <ProgressCard
              label="타임라인 진행도"
              value={progress.timeline}
              color="rgb(37, 99, 235)"
              colorClass="text-accent"
              name="타임라인"
              detail={`완료 ${progress.completed || 0} / 진행중 ${progress.working || 0} / 전체 ${progress.total || 0}`}
              workingValue={progress.total ? (progress.working / progress.total) * 100 : 0}
              cardClass="hover:border-accent/50 hover:shadow-accent/20"
            />
            <ProgressCard
              label="체크리스트 진행도"
              value={progress.checklist}
              color="rgb(96, 165, 250)"
              colorClass="text-chart-3"
              detail="체크리스트 완료율"
              name="체크리스트"
              cardClass="hover:border-chart-3/50 hover:shadow-chart-3/20"
            />
          </div>
        </div>

        {/* Timeline Sections */}
        <div className="space-y-12 mt-8">
          {sections.map((section, sectionIndex) => {
            const sectionItems = sortedTimeline.filter((item) => item.section === section);
            const subsectionValues = sectionItems.map((item) =>
              (item.subsection ?? '').toString().trim()
            );
            const nonEmptySubsections = [...new Set(subsectionValues.filter((v) => v))];
            const hasSubsections = nonEmptySubsections.length > 0;
            const hasEmptySubsection = subsectionValues.some((v) => !v);
            const subsections = hasSubsections
              ? [...nonEmptySubsections, ...(hasEmptySubsection ? ['기타'] : [])]
              : [];

            return (
              <div key={section} className="space-y-6">
                <div className="mb-16">
                  <div className="flex flex-row items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold shadow-md shadow-primary/20 border-2 border-primary/30">
                        {sectionIndex + 1}
                      </div>
                      <span>{section}</span>
                    </h2>
                    {section === '구축 및 설치' && hasSubsections && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setAllSubsectionsExpanded(sectionIndex, subsections.length, true)
                          }
                        >
                          <ChevronsDown className="mr-2 h-4 w-4" />
                          모두 펼침
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setAllSubsectionsExpanded(sectionIndex, subsections.length, false)
                          }
                        >
                          <ChevronsUp className="mr-2 h-4 w-4" />
                          모두 닫힘
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {hasSubsections ? (
                  <div className="space-y-4">
                    {subsections.map((subsection, subIndex) => {
                      const subsectionItems =
                        subsection === '기타'
                          ? sectionItems.filter(
                              (item) => !(item.subsection ?? '').toString().trim()
                            )
                          : sectionItems.filter(
                              (item) => (item.subsection ?? '').toString().trim() === subsection
                            );
                      const isExpanded = isSubsectionExpanded(sectionIndex, subIndex);
                      const completedCount = subsectionItems.filter(
                        (item) => item.status === 'completed'
                      ).length;
                      const totalCount = subsectionItems.length;
                      const progressPercent =
                        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                      return (
                        <div
                          key={subsection}
                          className="border border-border/40 rounded-xl overflow-hidden bg-card/50 shadow-sm"
                        >
                          <button
                            type="button"
                            onClick={() => toggleSubsection(sectionIndex, subIndex)}
                            className="w-full px-6 py-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 text-accent text-sm font-bold shadow-sm border border-accent/30">
                                {sectionIndex + 1}-{subIndex + 1}
                              </div>
                              <h3 className="text-lg font-semibold text-foreground/90">
                                {subsection}
                              </h3>
                              <span className="text-sm text-muted-foreground">
                                ({completedCount}/{totalCount})
                              </span>
                              {completedCount === totalCount && totalCount > 0 && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                  완료
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-10">
                                  {progressPercent}%
                                </span>
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="px-6 pb-8 pt-6 border-t border-border/30 bg-background/50">
                              <div className="block space-y-16 pt-8">
                                {renderDesktopRows(subsectionItems)}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="block space-y-16">{renderDesktopRows(sectionItems)}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 진행도 카드 컴포넌트
function ProgressCard({
  label,
  value,
  color,
  colorClass,
  detail,
  name,
  workingValue,
  cardClass = '',
}) {
  return (
    <Card
      className={`border border-border/60 hover:border-primary/50 transition-all bg-card shadow-lg hover:shadow-xl hover:shadow-primary/20 ${cardClass}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground mb-1">{label}</div>
            <div className={`text-3xl font-bold ${colorClass} mb-2`}>{value}%</div>
            <div className="text-xs text-muted-foreground">{detail}</div>
          </div>
          <div className="flex-shrink-0">
            <ProgressPieChart value={value} name={name} color={color} workingValue={workingValue} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
