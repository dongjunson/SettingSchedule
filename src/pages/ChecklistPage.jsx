import { ArrowLeft, Check, FileSpreadsheet } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorPage, LoadingSpinner } from '../components/common';
import { ProgressPieChart } from '../components/ProgressChart';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { exportChecklistToExcel } from '../lib/exportExcel';
import { calculateSiteProgress, useSite, useUpdateChecklistItem } from '../hooks/useQueries';
import { cn } from '../lib/utils';

export default function ChecklistPage() {
  const { siteId } = useParams();
  const navigate = useNavigate();

  // React Query Hooks
  const { data: site, isLoading: loading } = useSite(siteId);
  const { mutateAsync: updateChecklistItem } = useUpdateChecklistItem();

  const handleCheckboxChange = async (itemId, checked) => {
    try {
      await updateChecklistItem({ siteId, itemId, checked });
    } catch (err) {
      console.error('Failed to update checklist item:', err);
      window.alert('체크리스트 업데이트에 실패했습니다.');
    }
  };

  // 진행도 계산 (site가 변경될 때마다 자동으로 계산)
  const progress = site ? calculateSiteProgress(site) : { timeline: 0, checklist: 0, overall: 0, working: 0, completed: 0, total: 0 };

  if (loading) {
    return <LoadingSpinner message="데이터를 불러오는 중입니다..." />;
  }

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

  const completedCount = site.checklist.filter((item) => item.checked).length;
  const totalCount = site.checklist.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(`/site/${siteId}`)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            타임라인으로
          </Button>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{site.name} 점검 리스트</h1>
                <p className="text-muted-foreground">
                  시스템 기능 점검 항목을 확인하세요 (총 {totalCount}개 항목)
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => exportChecklistToExcel(site)}
                className="flex-shrink-0"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                엑셀 출력
              </Button>
            </div>
          </div>

          {/* Progress Card with Pie Chart */}
          <Card className="mb-6 border border-border/60 hover:border-chart-3/50 transition-all bg-card shadow-lg hover:shadow-xl hover:shadow-chart-3/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground mb-1">
                    체크리스트 진행도
                  </div>
                  <div className="text-3xl font-bold text-chart-3 mb-2">{progress.checklist}%</div>
                  <div className="text-xs text-muted-foreground">
                    {completedCount} / {totalCount} 항목 완료
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <ProgressPieChart
                    value={progress.checklist}
                    name="체크리스트"
                    color="rgb(96, 165, 250)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checklist Items */}
        <Card className="border border-border/60">
          <CardContent className="p-6">
            {/* 테이블 헤더 */}
            <div className="grid grid-cols-[80px_1fr_80px] gap-4 mb-4 pb-3 border-b border-border/60">
              <div className="text-sm font-semibold text-muted-foreground">번호</div>
              <div className="text-sm font-semibold text-muted-foreground">항목</div>
              <div className="text-sm font-semibold text-muted-foreground text-center">체크</div>
            </div>

            {/* 체크리스트 항목 */}
            <div className="space-y-3">
              {site.checklist.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    'grid grid-cols-[80px_1fr_80px] gap-4 items-start p-4 rounded-lg border-2 cursor-pointer transition-all shadow-md hover:shadow-lg',
                    item.checked
                      ? 'border-blue-500/70 bg-blue-50/60 hover:border-blue-500 hover:bg-blue-50 hover:shadow-blue-500/25'
                      : 'border-border/60 bg-white hover:border-primary/40 hover:bg-white hover:shadow-primary/10'
                  )}
                  onClick={() => handleCheckboxChange(item.id, !item.checked)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCheckboxChange(item.id, !item.checked);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {/* 번호 */}
                  <div className="flex items-center">
                    <span
                      className={cn(
                        'text-base font-semibold',
                        item.checked ? 'text-blue-600' : 'text-muted-foreground'
                      )}
                    >
                      No. {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* 항목 텍스트 */}
                  <div className="flex items-center">
                    <p
                      className={cn(
                        'leading-relaxed text-base font-medium',
                        item.checked ? 'text-blue-600' : 'text-foreground'
                      )}
                    >
                      {item.text}
                    </p>
                  </div>

                  {/* 체크 상태 */}
                  <div className="flex items-center justify-center">
                    {item.checked ? (
                      <Check className="h-6 w-6 text-blue-600 font-bold" />
                    ) : (
                      <span className="text-muted-foreground text-base">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
