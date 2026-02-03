import { Building2, ChevronRight, FileSpreadsheet, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useSites } from '../hooks/useQueries';
import { STAGE, STAGE_LABELS } from '../lib/constants';
import { cn } from '../lib/utils';

const TAB_ALL = 'all';
const TAB_HIDDEN = 'hidden';
const TAB_IN_PROGRESS = STAGE.IN_PROGRESS;
const TAB_COMPLETED = STAGE.COMPLETED;

function filterByTab(sites, tab) {
  if (tab === TAB_ALL) return sites;
  if (tab === TAB_HIDDEN)
    return sites.filter((s) => s.stage !== STAGE.IN_PROGRESS && s.stage !== STAGE.COMPLETED);
  return sites.filter((s) => s.stage === tab);
}

function filterBySearch(sites, query) {
  if (!query.trim()) return sites;
  const q = query.trim().toLowerCase();
  return sites.filter((s) => s.name?.toLowerCase().includes(q) || s.id?.toLowerCase().includes(q));
}

export default function IncomeStatementPage() {
  const navigate = useNavigate();
  const { data: sites = [], isLoading } = useSites();
  const [tab, setTab] = useState(TAB_ALL);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSites = useMemo(() => {
    const byTab = filterByTab(sites, tab);
    return filterBySearch(byTab, searchQuery);
  }, [sites, tab, searchQuery]);

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">손익계산서</h1>
      <p className="text-muted-foreground mb-6">
        전체 프로젝트 목록입니다. 단계별 탭과 사업소명 검색으로 확인할 수 있습니다.
      </p>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">데이터를 불러오는 중입니다...</p>
        </div>
      ) : (
        <>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <TabsList className="w-full sm:w-auto shrink-0">
                <TabsTrigger value={TAB_ALL}>전체</TabsTrigger>
                <TabsTrigger value={TAB_HIDDEN}>영업중</TabsTrigger>
                <TabsTrigger value={TAB_IN_PROGRESS}>구축중</TabsTrigger>
                <TabsTrigger value={TAB_COMPLETED}>구축완료</TabsTrigger>
              </TabsList>
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="사업소명 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <TabsContent value={tab} className="mt-0">
              <ProjectList sites={filteredSites} navigate={navigate} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function ProjectList({ sites, navigate }) {
  if (sites.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          해당 조건의 프로젝트가 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">프로젝트 ({sites.length}건)</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {sites.map((site) => {
            const isSalesPhase =
              site.stage == null ||
              (site.stage !== STAGE.IN_PROGRESS && site.stage !== STAGE.COMPLETED);
            return (
              <li
                key={site.id}
                className={cn(
                  'flex items-center justify-between gap-4 py-3 px-3 rounded-lg',
                  isSalesPhase && 'bg-sky-50/40 dark:bg-sky-950/10',
                  site.stage === STAGE.COMPLETED && 'bg-slate-100/30 dark:bg-slate-800/15'
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex-shrink-0 p-1.5 rounded-md bg-muted/50">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground truncate text-sm">{site.name}</p>
                    <span
                      className={cn(
                        'shrink-0 text-xs font-semibold px-2 py-1 rounded-md tracking-tight',
                        site.stage === STAGE.IN_PROGRESS &&
                          'bg-primary/15 text-primary border border-primary/30 dark:bg-primary/25 dark:text-primary dark:border-primary/40',
                        site.stage === STAGE.COMPLETED &&
                          'bg-slate-200 text-slate-800 border border-slate-300/80 dark:bg-slate-600 dark:text-slate-100 dark:border-slate-500/50',
                        site.stage !== STAGE.IN_PROGRESS &&
                          site.stage !== STAGE.COMPLETED &&
                          'bg-muted text-muted-foreground border border-border/20'
                      )}
                    >
                      {STAGE_LABELS[site.stage] ?? '영업중'}
                    </span>
                    {site.stage === STAGE.IN_PROGRESS && (
                      <>
                        <span className="text-muted-foreground/60">·</span>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-primary hover:underline"
                          onClick={() => navigate(`/site/${site.id}`)}
                        >
                          타임라인
                        </button>
                        <span className="text-muted-foreground/60 text-xs">·</span>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-primary hover:underline"
                          onClick={() => navigate(`/site/${site.id}/checklist`)}
                        >
                          체크리스트
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 flex items-center gap-1.5 text-xs bg-background border-border hover:bg-muted/80"
                  onClick={() =>
                    navigate(`/income-statement/manage?siteId=${encodeURIComponent(site.id)}`)
                  }
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                  손익계산서 관리
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
