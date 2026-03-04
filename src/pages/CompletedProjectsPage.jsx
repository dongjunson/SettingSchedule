import { CheckCircle2, ExternalLink } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { calculateSiteProgress, useSites } from '../hooks/useQueries';
import { getHealthCheck } from '../lib/api';
import { STAGE } from '../lib/constants';

export default function CompletedProjectsPage() {
  const navigate = useNavigate();
  const { data: sites = [], isLoading } = useSites();
  const loading = isLoading && !sites.length;
  const [healthBySiteId, setHealthBySiteId] = useState(() => ({}));

  const completedSites = useMemo(() => {
    const filtered = sites.filter((s) => s.stage === STAGE.COMPLETED);
    return filtered.map((site) => ({
      ...site,
      progress: calculateSiteProgress(site),
    }));
  }, [sites]);

  useEffect(() => {
    const withUrl = completedSites.filter((s) => s.siteUrl?.trim());
    if (withUrl.length === 0) return;
    let cancelled = false;
    for (const site of withUrl) {
      getHealthCheck(site.siteUrl).then((ok) => {
        if (!cancelled) setHealthBySiteId((prev) => ({ ...prev, [site.id]: ok }));
      });
    }
    return () => { cancelled = true; };
  }, [completedSites]);

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
              className="group overflow-hidden rounded-xl border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:shadow-md shadow-sm transition-all duration-200"
            >
              <CardHeader className="pb-2 pt-5 px-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-bold truncate leading-tight text-slate-700">
                      {site.name}
                    </CardTitle>
                    <p className="text-[11px] text-slate-400 truncate mt-1">{site.id}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {site.siteUrl && (
                      <>
                        <span
                          className="shrink-0 w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                          title={
                            healthBySiteId[site.id] === true
                              ? '사이트 연결됨'
                              : healthBySiteId[site.id] === false
                                ? '연결 실패'
                                : '확인 중...'
                          }
                          style={{
                            backgroundColor:
                              healthBySiteId[site.id] === true
                                ? 'rgb(34, 197, 94)'
                                : healthBySiteId[site.id] === false
                                  ? 'rgb(148, 163, 184)'
                                  : 'rgb(203, 213, 225)',
                          }}
                        />
                        <a
                          href={site.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-500/10 text-slate-700 hover:bg-slate-500/20 border border-slate-400/30 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          바로가기
                        </a>
                      </>
                    )}
                    <span className="inline-flex items-center justify-center gap-1.5 bg-slate-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm h-7 min-h-[1.75rem] leading-none">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      구축완료
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 pb-5 px-5">
                <div
                  className="grid grid-cols-2 gap-2"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.key === 'Enter' && e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="py-2.5 rounded-lg bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 text-sm font-medium transition-colors"
                    onClick={() => navigate(`/site/${site.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/site/${site.id}`)}
                  >
                    타임라인
                  </button>
                  <button
                    type="button"
                    className="py-2.5 rounded-lg bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 text-sm font-medium transition-colors"
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
