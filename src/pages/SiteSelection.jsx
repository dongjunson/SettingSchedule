import { ArrowRight, Building2, LogOut } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressPieChart } from '../components/ProgressChart';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';
import { useStore } from '../lib/store';
import { useUserStore } from '../lib/userStore';

export default function SiteSelection() {
  const navigate = useNavigate();

  // zustand 스토어에서 상태와 함수 가져오기
  const sites = useStore((state) => state.sites);
  const loading = useStore((state) => state.loading);
  const loadAllSites = useStore((state) => state.loadAllSites);
  const calculateProgress = useStore((state) => state.calculateProgress);

  // 사용자 스토어
  const logout = useUserStore((state) => state.logout);
  const getEmail = useUserStore((state) => state.getEmail);
  const getGroup = useUserStore((state) => state.getGroup);

  useEffect(() => {
    const loadSitesData = async () => {
      try {
        // 새로고침 시마다 항상 API에서 최신 데이터 가져오기
        await loadAllSites(true);
      } catch (error) {
        console.error('Failed to load sites data:', error);
      }
    };
    // 페이지 마운트 시 (새로고침 포함) 항상 API 호출
    loadSitesData();
  }, [loadAllSites]);

  // sites와 진행도 계산을 메모이제이션
  const sitesWithProgress = useMemo(() => {
    return sites.map((site) => ({
      ...site,
      progress: calculateProgress(site.id),
    }));
  }, [sites, calculateProgress]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          {/* 헤더 영역 - 로고와 타이틀을 위한 개선된 레이아웃 */}
          <div className="mb-8 pb-6 border-b border-border/40">
            <div className="flex items-start justify-between gap-6">
              {/* 왼쪽: 로고와 타이틀 영역 */}
              <div className="flex items-start gap-4 flex-1">
                {/* 로고 이미지 영역 */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center shadow-sm">
                    {/* 로고 이미지가 추가되면 아래 주석을 해제하고 img 태그를 사용하세요 */}
                    {/* <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-2" /> */}
                    <Building2 className="h-10 w-10 md:h-12 md:w-12 text-primary/60" />
                  </div>
                </div>

                {/* 타이틀과 설명 */}
                <div className="flex-1 pt-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
                    JRI PMS
                  </h1>
                  <div className="space-y-1">
                    <p className="text-base md:text-lg text-muted-foreground font-medium">
                      Project Management System
                    </p>
                    <p className="text-sm md:text-base text-muted-foreground">
                      프로젝트를 선택하여 타임라인과 체크리스트를 확인하세요
                    </p>
                  </div>
                </div>
              </div>

              {/* 오른쪽: 로그아웃 버튼 */}
              <div className="flex-shrink-0 flex items-center pt-2">
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
                      <div className="font-semibold">{getEmail()}</div>
                      <div className="text-xs text-muted-foreground">그룹: {getGroup()}</div>
                      <div className="text-xs text-muted-foreground">클릭하여 로그아웃</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sitesWithProgress.map((site) => (
              <Card
                key={site.id}
                className="hover:shadow-xl hover:shadow-primary/15 transition-all cursor-pointer border border-border/60 hover:border-primary/40 bg-card shadow-md"
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-md shadow-primary/20 border border-primary/25">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl text-foreground">{site.name}</CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    타임라인 및 체크리스트 관리
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-foreground mb-1">
                          전체 진행도
                        </div>
                        <div className="text-2xl font-bold text-primary mb-1">
                          {site.progress.overall}%
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                          <div>
                            <div className="text-muted-foreground mb-0.5">타임라인</div>
                            <div className="font-semibold text-foreground">
                              {site.progress.timeline}%
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-0.5">체크리스트</div>
                            <div className="font-semibold text-foreground">
                              {site.progress.checklist}%
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-0.5">진행중</div>
                            <div className="font-semibold text-gray-500">
                              {site.progress.working || 0}개
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <ProgressPieChart
                          value={site.progress.overall}
                          name="전체"
                          color="rgb(59, 130, 246)"
                          workingValue={
                            site.progress.total
                              ? (site.progress.working / site.progress.total) * 100 * 0.7
                              : 0
                          }
                        />
                      </div>
                    </div>

                    <Button onClick={() => navigate(`/site/${site.id}`)} className="w-full">
                      프로젝트 열기
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
