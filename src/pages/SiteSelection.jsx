import { useNavigate } from 'react-router-dom'
import { Building2, ArrowRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { ProgressPieChart } from '../components/ProgressChart'

export default function SiteSelection() {
  const navigate = useNavigate()
  
  // zustand 스토어에서 상태와 함수 가져오기
  const sites = useStore((state) => state.sites)
  const loading = useStore((state) => state.loading)
  const loadAllSites = useStore((state) => state.loadAllSites)
  const calculateProgress = useStore((state) => state.calculateProgress)

  useEffect(() => {
    const loadSitesData = async () => {
      try {
        // 새로고침 시마다 항상 API에서 최신 데이터 가져오기
        await loadAllSites(true)
      } catch (error) {
        console.error('Failed to load sites data:', error)
      }
    }
    // 페이지 마운트 시 (새로고침 포함) 항상 API 호출
    loadSitesData()
  }, [loadAllSites])

  // sites와 진행도 계산을 메모이제이션
  const sitesWithProgress = useMemo(() => {
    return sites.map(site => ({
      ...site,
      progress: calculateProgress(site.id),
    }))
  }, [sites, calculateProgress])

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">사업소 타임라인 관리 시스템</h1>
          <p className="text-muted-foreground">사업소를 선택하여 타임라인과 체크리스트를 확인하세요</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sitesWithProgress.map((site) => (
            <Card key={site.id} className="hover:shadow-xl hover:shadow-primary/15 transition-all cursor-pointer border border-border/60 hover:border-primary/40 bg-card shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-md shadow-primary/20 border border-primary/25">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{site.name}</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">타임라인 및 체크리스트 관리</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground mb-1">전체 진행도</div>
                      <div className="text-2xl font-bold text-primary mb-1">{site.progress.overall}%</div>
                      <div className="grid grid-cols-2 gap-3 text-xs mt-2">
                        <div>
                          <div className="text-muted-foreground mb-0.5">타임라인</div>
                          <div className="font-semibold text-foreground">{site.progress.timeline}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-0.5">체크리스트</div>
                          <div className="font-semibold text-foreground">{site.progress.checklist}%</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <ProgressPieChart 
                        value={site.progress.overall} 
                        name="전체" 
                        color="rgb(59, 130, 246)" 
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate(`/site/${site.id}`)}
                    className="w-full"
                  >
                    사업소 열기
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
  )
}
