import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, Check, X, Clock, ListChecks } from 'lucide-react'
import { getSiteData, updateTimelineItem, calculateProgress } from '../lib/storage'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { ProgressPieChart } from '../components/ProgressChart'
import { cn } from '../lib/utils'

export default function TimelinePage() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const [site, setSite] = useState(null)
  const [progress, setProgress] = useState({ timeline: 0, checklist: 0, overall: 0 })

  useEffect(() => {
    const siteData = getSiteData(siteId)
    if (siteData) {
      setSite(siteData)
      setProgress(calculateProgress(siteId))
    }
  }, [siteId])

  const handleStatusChange = (itemId, type, newStatus) => {
    const updates = type === 'rnd' ? { rnd: newStatus } : { field: newStatus }
    updateTimelineItem(siteId, itemId, updates)
    const updatedSite = getSiteData(siteId)
    setSite(updatedSite)
    setProgress(calculateProgress(siteId))
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

  const getStatusColor = (status, itemStatus = null) => {
    // If item has specific status (completed/working), use that color
    if (itemStatus === 'both-completed') {
      return 'bg-green-500 text-white hover:bg-green-600 hover:text-white shadow-md shadow-green-500/30'
    } else if (itemStatus === 'one-completed') {
      return 'bg-blue-400 text-white hover:bg-blue-500 hover:text-white shadow-md shadow-blue-400/30'
    } else if (itemStatus === 'working') {
      return 'bg-accent text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground shadow-md shadow-accent/20'
    }
    
    // Default status-based colors
    switch (status) {
      case 'completed':
        return 'bg-blue-400 text-white hover:bg-blue-500 hover:text-white shadow-md shadow-blue-400/30'
      case 'working':
        return 'bg-accent text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground shadow-md shadow-accent/20'
      case 'pending':
        return 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-muted-foreground border border-border/60'
      default:
        return 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-muted-foreground border border-border/60'
    }
  }

  const getNextStatus = (currentStatus) => {
    const statusOrder = ['pending', 'working', 'completed']
    const currentIndex = statusOrder.indexOf(currentStatus)
    return statusOrder[(currentIndex + 1) % statusOrder.length]
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
        <div className="space-y-8">
          {sections.map((section, sectionIndex) => {
            const sectionItems = site.timeline.filter(item => item.section === section)
            // 한 행에 표시할 항목 수 (반응형)
            const itemsPerRow = 3
            
            return (
              <div key={section} className="space-y-6">
                {/* Section Header */}
                <div className="mb-6">
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
                        {/* Horizontal Timeline Line with gradient on both sides */}
                        <div className="absolute top-8 left-0 right-0 h-0.5 z-0">
                          <div className="h-full bg-gradient-to-r from-transparent via-primary/70 to-transparent"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                          {rowItems.map((item, itemIndex) => {
                            const isLastInRow = itemIndex === rowItems.length - 1
                            const isCompleted = item.rnd === 'completed' && item.field === 'completed'
                            const isFirstInRow = itemIndex === 0
                            const oneCompleted = (item.rnd === 'completed' || item.field === 'completed') && !isCompleted
                            const isWorking = (item.rnd === 'working' || item.field === 'working') && !isCompleted && !oneCompleted
                            
                            // Determine item status for button colors
                            let itemStatus = null
                            if (isCompleted) {
                              itemStatus = 'both-completed'
                            } else if (oneCompleted) {
                              itemStatus = 'one-completed'
                            } else if (isWorking) {
                              itemStatus = 'working'
                            }
                            
                            return (
                              <div key={item.id} className="relative flex flex-col items-center h-full">
                                {/* Vertical connecting line from previous row's first item to current row's first item */}
                                {rowIndex > 0 && isFirstInRow && (
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-gradient-to-b from-primary/70 via-primary/50 to-primary/70 z-0" style={{ top: '-4rem' }}></div>
                                )}
                                
                                {/* Timeline Node - centered on horizontal line */}
                                <div className="relative z-10 mb-6" style={{ marginTop: '-2rem' }}>
                                  <div className={cn(
                                    "flex items-center justify-center w-16 h-16 rounded-full font-bold text-lg shadow-lg border-2 transition-all",
                                    isCompleted
                                      ? "bg-green-500 text-white border-green-600 shadow-green-500/40"
                                      : oneCompleted
                                      ? "bg-blue-400 text-white border-blue-500 shadow-blue-400/30"
                                      : isWorking
                                      ? "bg-accent text-accent-foreground border-accent shadow-accent/30"
                                      : "bg-muted text-muted-foreground border-border/60"
                                  )}>
                                    {item.step}
                                  </div>
                                </div>

                                {/* Content Card */}
                                <div className="w-full pt-6">
                                  <Card className={cn(
                                    "transition-all shadow-md hover:shadow-lg h-full flex flex-col",
                                    isCompleted
                                      ? "border-2 border-green-500/70 bg-green-50/60 hover:border-green-500 hover:bg-green-50 hover:shadow-green-500/25"
                                      : oneCompleted
                                      ? "border-2 border-blue-400/60 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50/70 hover:shadow-blue-400/20"
                                      : isWorking
                                      ? "border border-accent/60 bg-accent/10 hover:border-accent hover:bg-accent/15 hover:shadow-accent/10"
                                      : "border border-border/60 hover:border-primary/40 bg-card hover:bg-card/95 hover:shadow-primary/10"
                                  )}>
                                    <CardContent className="p-6 flex flex-col flex-1 min-h-[220px]">
                                      <h3 className={cn(
                                        "font-semibold text-lg mb-5 leading-tight text-center min-h-[5rem] flex items-center justify-center",
                                        isCompleted
                                          ? "text-green-800"
                                          : oneCompleted
                                          ? "text-blue-700"
                                          : isWorking
                                          ? "text-accent-foreground"
                                          : "text-foreground"
                                      )}>
                                        {item.task}
                                      </h3>
                                      
                                      <div className="space-y-3 mt-auto">
                                        <button
                                          onClick={() => handleStatusChange(item.id, 'rnd', getNextStatus(item.rnd))}
                                          className={cn(
                                            "w-full px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-all hover:scale-[1.02] min-h-[36px]",
                                            getStatusColor(item.rnd, itemStatus)
                                          )}
                                        >
                                          {getStatusIcon(item.rnd)}
                                          <span className="text-xs">
                                            {item.rnd === 'completed' ? '완료' : item.rnd === 'working' ? '작업중' : '대기'}
                                          </span>
                                        </button>
                                        
                                        <button
                                          onClick={() => handleStatusChange(item.id, 'field', getNextStatus(item.field))}
                                          className={cn(
                                            "w-full px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-all hover:scale-[1.02] min-h-[36px]",
                                            getStatusColor(item.field, itemStatus)
                                          )}
                                        >
                                          {getStatusIcon(item.field)}
                                          <span className="text-xs">
                                            {item.field === 'completed' ? '완료' : item.field === 'working' ? '작업중' : '대기'}
                                          </span>
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
