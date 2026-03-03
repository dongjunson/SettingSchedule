import { Building2, CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressPieChart } from '../components/ProgressChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { calculateSiteProgress, useSites } from '../hooks/useQueries';
import { STAGE } from '../lib/constants';

export default function CompletedProjectsPage() {
  const navigate = useNavigate();
  const { data: sites = [], isLoading } = useSites();
  const loading = isLoading && !sites.length;

  const completedSites = useMemo(() => {
    const filtered = sites.filter((s) => s.stage === STAGE.COMPLETED);
    return filtered.map((site) => ({
      ...site,
      progress: calculateSiteProgress(site),
    }));
  }, [sites]);

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">구축완료 프로젝트</h1>
      <p className="text-muted-foreground mb-6">
        구축이 완료된 프로젝트 목록입니다. 타임라인·체크리스트를 확인할 수 있습니다.
      </p>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">데이터를 불러오는 중입니다...</p>
        </div>
      ) : completedSites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            구축완료 프로젝트가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {completedSites.map((site) => (
            <Card
              key={site.id}
              className="group overflow-hidden border-slate-300 bg-slate-50 hover:border-slate-400 hover:shadow-md shadow-sm transition-all duration-200"
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between gap-3 min-h-[2.25rem]">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0 p-2.5 rounded-lg bg-slate-200/80 text-slate-600 h-10 w-10 flex items-center justify-center">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base font-bold truncate leading-tight text-slate-700">
                        {site.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        전체 진행도 {site.progress.overall}%
                      </CardDescription>
                    </div>
                  </div>
                  <span className="flex-shrink-0 inline-flex items-center gap-1 bg-slate-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm h-6">
                    <CheckCircle2 className="h-3 w-3" />
                    구축완료
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-0 pb-4 px-4">
                <div className="flex items-center justify-between gap-4 mb-4 min-h-[5rem]">
                  <div className="text-2xl font-bold text-slate-600 shrink-0">
                    {site.progress.overall}%
                  </div>
                  <div className="w-20 h-20 shrink-0 overflow-hidden flex items-center justify-center">
                    <ProgressPieChart
                      value={site.progress.overall}
                      name="전체"
                      color="rgb(100, 116, 139)"
                      workingValue={
                        site.progress.total
                          ? (site.progress.working / site.progress.total) * 100 * 0.7
                          : 0
                      }
                    />
                  </div>
                </div>
                <div
                  className="grid grid-cols-2 gap-2"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.key === 'Enter' && e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="py-2.5 rounded-md bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 text-sm font-medium transition-colors"
                    onClick={() => navigate(`/site/${site.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/site/${site.id}`)}
                  >
                    타임라인
                  </button>
                  <button
                    type="button"
                    className="py-2.5 rounded-md bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 text-sm font-medium transition-colors"
                    onClick={() => navigate(`/site/${site.id}/checklist`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/site/${site.id}/checklist`)}
                  >
                    체크리스트
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
