import { ArrowLeft, Check } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProgressPieChart } from '../components/ProgressChart';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';

export default function ChecklistPage() {
  const { siteId } = useParams();
  const navigate = useNavigate();

  // zustand 스토어에서 상태와 함수 가져오기
  const site = useStore((state) => state.sites.find((s) => s.id === siteId));
  const loading = useStore((state) => state.loading);
  const loadSite = useStore((state) => state.loadSite);
  const updateChecklistItem = useStore((state) => state.updateChecklistItem);
  const calculateProgress = useStore((state) => state.calculateProgress);

  useEffect(() => {
    const loadSiteData = async () => {
      try {
        // 새로고침 시마다 항상 API에서 최신 데이터 가져오기
        await loadSite(siteId, true);
      } catch (error) {
        console.error('Failed to load site data:', error);
      }
    };
    // 페이지 마운트 시 (새로고침 포함) 항상 API 호출
    loadSiteData();
  }, [siteId, loadSite]);

  const handleCheckboxChange = async (itemId, checked) => {
    // zustand 스토어를 통해 업데이트 (자동으로 리렌더링됨)
    await updateChecklistItem(siteId, itemId, checked);
  };

  // 진행도 계산 (site가 변경될 때마다 자동으로 계산)
  const progress = site ? calculateProgress(siteId) : { timeline: 0, checklist: 0, overall: 0 };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!site) {
    return <div className="p-8">프로젝트를 찾을 수 없습니다.</div>;
  }

  const completedCount = site.checklist.filter((item) => item.checked).length;
  const totalCount = site.checklist.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(`/site/${siteId}`)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            타임라인으로
          </Button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">{site.name} 점검 리스트</h1>
            <p className="text-muted-foreground">
              시스템 기능 점검 항목을 확인하세요 (총 {totalCount}개 항목)
            </p>
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
            <div className="space-y-4">
              {site.checklist.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all shadow-md hover:shadow-lg',
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
                  <div className="mt-1">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={(checked) => handleCheckboxChange(item.id, checked)}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          item.checked ? 'text-blue-500' : 'text-muted-foreground'
                        )}
                      >
                        No. {String(item.id).padStart(2, '0')}
                      </span>
                      {item.checked && <Check className="h-4 w-4 text-blue-500" />}
                    </div>
                    <p
                      className={cn(
                        'leading-relaxed',
                        item.checked ? 'text-blue-500' : 'text-foreground'
                      )}
                    >
                      {item.text}
                    </p>
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
