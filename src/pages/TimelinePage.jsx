import { useParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ArrowLeft, Check, X, Clock, ListChecks } from 'lucide-react'
import { useStore } from '../lib/store'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { ProgressPieChart } from '../components/ProgressChart'
import { cn } from '../lib/utils'

export default function TimelinePage() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  
  // zustand 스토어에서 상태와 함수 가져오기
  const site = useStore((state) => state.sites.find(s => s.id === siteId))
  const loading = useStore((state) => state.loading)
  const loadSite = useStore((state) => state.loadSite)
  const updateTimelineItem = useStore((state) => state.updateTimelineItem)
  const calculateProgress = useStore((state) => state.calculateProgress)

  useEffect(() => {
    const loadSiteData = async () => {
      try {
        // 새로고침 시마다 항상 API에서 최신 데이터 가져오기
        await loadSite(siteId, true)
      } catch (error) {
        console.error('Failed to load site data:', error)
      }
    }
    // 페이지 마운트 시 (새로고침 포함) 항상 API 호출
    loadSiteData()
  }, [siteId, loadSite])

  const getNextStatus = (currentStatus) => {
    // pending -> working -> completed -> pending 순환
    const statusOrder = ['pending', 'working', 'completed']
    const currentIndex = statusOrder.indexOf(currentStatus || 'pending')
    return statusOrder[(currentIndex + 1) % statusOrder.length]
  }

  const handleStatusChange = async (itemId, currentStatus) => {
    const nextStatus = getNextStatus(currentStatus)
    const updates = {
      status: nextStatus,
      // completed 상태로 변경될 때만 completedAt 저장
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : null
    }
    // zustand 스토어를 통해 업데이트 (자동으로 리렌더링됨)
    await updateTimelineItem(siteId, itemId, updates)
  }

  // 진행도 계산 (site가 변경될 때마다 자동으로 계산)
  const progress = site ? calculateProgress(siteId) : { timeline: 0, checklist: 0, overall: 0 }
  
  const formatCompletedTime = (completedAt) => {
    if (!completedAt) return null
    const date = new Date(completedAt)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${month}/${day}`
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4" />
      case 'working':
        return <Clock className="h-4 w-4" />
      case 'pending':
        return <X className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-blue-500 text-white hover:bg-blue-600 hover:text-white shadow-md shadow-blue-500/30'
      case 'working':
        return 'bg-gray-500 text-white hover:bg-gray-600 hover:text-white shadow-md shadow-gray-500/30'
      case 'pending':
        return 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-muted-foreground border border-border/60'
      default:
        return 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-muted-foreground border border-border/60'
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!site) {
    return <div className="p-8">사업소를 찾을 수 없습니다.</div>
  }

  const sections = [...new Set(site.timeline.map(item => item.section))]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            사업소 목록으로
          </Button>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <span className="w-1 h-8 bg-primary rounded-full"></span>
                {site.name} 설치 타임라인
              </h1>
              <p className="text-muted-foreground ml-4">타임라인 항목을 클릭하여 상태를 변경할 수 있습니다</p>
            </div>
            <Button 
              onClick={() => navigate(`/site/${siteId}/checklist`)}
              className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              <ListChecks className="mr-2 h-4 w-4" />
              점검 리스트
            </Button>
          </div>

          {/* Progress Cards with Pie Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border border-border/60 hover:border-primary/50 transition-all bg-card shadow-lg hover:shadow-xl hover:shadow-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground mb-1">전체 진행도</div>
                    <div className="text-3xl font-bold text-primary mb-2">{progress.overall}%</div>
                    <div className="text-xs text-muted-foreground">전체 작업 진행률</div>
                  </div>
                  <div className="flex-shrink-0">
                    <ProgressPieChart 
                      value={progress.overall} 
                      name="전체" 
                      color="rgb(59, 130, 246)" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border/60 hover:border-accent/50 transition-all bg-card shadow-lg hover:shadow-xl hover:shadow-accent/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground mb-1">타임라인 진행도</div>
                    <div className="text-3xl font-bold text-accent mb-2">{progress.timeline}%</div>
                    <div className="text-xs text-muted-foreground">타임라인 작업 진행률</div>
                  </div>
                  <div className="flex-shrink-0">
                    <ProgressPieChart 
                      value={progress.timeline} 
                      name="타임라인" 
                      color="rgb(37, 99, 235)" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border/60 hover:border-chart-3/50 transition-all bg-card shadow-lg hover:shadow-xl hover:shadow-chart-3/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground mb-1">체크리스트 진행도</div>
                    <div className="text-3xl font-bold text-chart-3 mb-2">{progress.checklist}%</div>
                    <div className="text-xs text-muted-foreground">체크리스트 완료율</div>
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
        </div>

        {/* Horizontal Timeline */}
        <div className="space-y-12">
          {sections.map((section, sectionIndex) => {
            const sectionItems = site.timeline.filter(item => item.section === section)
            // 한 행에 표시할 항목 수 (반응형)
            const itemsPerRow = 3
            
            return (
              <div key={section} className="space-y-6">
                {/* Section Header */}
                <div className="mb-16">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold shadow-md shadow-primary/20 border-2 border-primary/30">
                      {sectionIndex + 1}
                    </div>
                    <span>{section}</span>
                  </h2>
                </div>

                {/* Timeline Rows */}
                <div className="space-y-16">
                  {Array.from({ length: Math.ceil(sectionItems.length / itemsPerRow) }).map((_, rowIndex) => {
                    const rowItems = sectionItems.slice(rowIndex * itemsPerRow, (rowIndex + 1) * itemsPerRow)
                    const isLastRow = rowIndex === Math.ceil(sectionItems.length / itemsPerRow) - 1
                    const totalRows = Math.ceil(sectionItems.length / itemsPerRow)
                    
                    return (
                      <div key={rowIndex} className="relative">
                        {/* Horizontal Timeline Line with gradient on both sides - centered on badge */}
                        <div className="absolute top-0 left-0 right-0 h-1 z-0">
                          <div className="h-full bg-gradient-to-r from-transparent via-primary via-primary/90 to-transparent"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                          {rowItems.map((item, itemIndex) => {
                            const isLastInRow = itemIndex === rowItems.length - 1
                            // role 값 정규화 및 검증 (공백 제거, 소문자 변환)
                            let role = (item.role || 'both').toString().trim().toLowerCase()
                            // 유효하지 않은 role 값은 'both'로 설정
                            if (role !== 'rnd' && role !== 'field' && role !== 'both') {
                              console.warn(`Invalid role value: ${item.role}, defaulting to 'both'`, item)
                              role = 'both'
                            }
                            
                            // status 기반으로 상태 판단 (단순화)
                            const currentStatus = item.status || 'pending'
                            const isCompleted = currentStatus === 'completed'
                            const isWorking = currentStatus === 'working'
                            
                            const isFirstInRow = itemIndex === 0
                            
                            return (
                              <div key={item.id} className="relative flex flex-col items-center h-full">
                                {/* Timeline Node - centered on horizontal line */}
                                <div className="relative z-10 mb-6" style={{ marginTop: '-2rem' }}>
                                  <div className={cn(
                                    "flex items-center justify-center w-16 h-16 rounded-full font-bold text-lg shadow-lg border-2 transition-all",
                                    isCompleted
                                      ? "bg-blue-500 text-white border-blue-600 shadow-blue-500/40"
                                      : isWorking
                                      ? "bg-gray-500 text-white border-gray-600 shadow-gray-500/30"
                                      : "bg-white text-foreground border-border/60 shadow-md"
                                  )}>
                                    {item.step}
                                  </div>
                                </div>

                                {/* Content Card */}
                                <div className="w-full pt-6">
                                  <Card className={cn(
                                    "transition-all shadow-md hover:shadow-lg flex flex-col relative",
                                    isCompleted
                                      ? "border-2 border-blue-500/70 bg-blue-50/60 hover:border-blue-500 hover:bg-blue-50 hover:shadow-blue-500/25"
                                      : isWorking
                                      ? "border-2 border-gray-300 bg-gray-100 hover:border-gray-400 hover:bg-gray-200 hover:shadow-gray-300/20"
                                      : "border-2 border-border/60 bg-white hover:border-primary/40 hover:bg-white hover:shadow-primary/10"
                                  )} style={{ height: '170px' }}>
                                    {/* Role Badges - 우측 상단 */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                                      {/* R&D 뱃지: role이 'rnd'이거나 'both'일 때만 표시 */}
                                      {role === 'rnd' && (
                                        <div className="px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-semibold shadow-sm flex items-center justify-center">
                                          R&D
                                        </div>
                                      )}
                                      {/* 현장팀 뱃지: role이 'field'이거나 'both'일 때만 표시 */}
                                      {role === 'field' && (
                                        <div className="px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-semibold shadow-sm flex items-center justify-center">
                                          현장팀
                                        </div>
                                      )}
                                      {/* Both 뱃지: role이 'both'일 때만 두 뱃지 모두 표시 */}
                                      {role === 'both' && (
                                        <>
                                          <div className="px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-semibold shadow-sm flex items-center justify-center">
                                            R&D
                                          </div>
                                          <div className="px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-semibold shadow-sm flex items-center justify-center">
                                            현장팀
                                          </div>
                                        </>
                                      )}
                                    </div>
                                    
                                    <CardContent className="p-4 flex flex-col flex-1 h-full">
                                      <h3 className={cn(
                                        "font-semibold text-lg mb-3 leading-snug text-center flex items-center justify-center flex-1",
                                        isCompleted
                                          ? "text-blue-500"
                                          : isWorking
                                          ? "text-gray-700"
                                          : "text-foreground"
                                      )}>
                                        {item.task}
                                      </h3>
                                      
                                      <div className="mt-0 relative">
                                        <button
                                          onClick={() => handleStatusChange(item.id, currentStatus)}
                                          className={cn(
                                            "w-full px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-all min-h-[36px]",
                                            getStatusColor(currentStatus)
                                          )}
                                        >
                                          {getStatusIcon(currentStatus)}
                                          <span className="text-xs">
                                            {currentStatus === 'completed' ? '완료' : currentStatus === 'working' ? '작업중' : '대기'}
                                          </span>
                                          {isCompleted && item.completedAt && (
                                            <span className="text-[11px] ml-1 opacity-90">
                                              ({formatCompletedTime(item.completedAt)})
                                            </span>
                                          )}
                                        </button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
