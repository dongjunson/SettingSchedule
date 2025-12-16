import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, Check, X, Clock, ListChecks, ChevronDown, ChevronRight, LogIn, FileSpreadsheet, User } from 'lucide-react'
import { useStore } from '../lib/store'
import { useUserStore } from '../lib/userStore'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { ProgressPieChart } from '../components/ProgressChart'
import { DateRangePicker } from '../components/DateRangePicker'
import { cn } from '../lib/utils'
import { exportTimelineToExcel } from '../lib/exportExcel'

export default function TimelinePage() {
  const { siteId } = useParams()
  const navigate = useNavigate()

  // zustand 스토어에서 상태와 함수 가져오기
  const site = useStore((state) => state.sites.find(s => s.id === siteId))
  const loading = useStore((state) => state.loading)
  const loadSite = useStore((state) => state.loadSite)
  const updateTimelineItem = useStore((state) => state.updateTimelineItem)
  const calculateProgress = useStore((state) => state.calculateProgress)

  // 사용자 스토어
  const currentUser = useUserStore((state) => state.currentUser)

  // 아코디언 상태 관리 (섹션-서브섹션 조합을 키로 사용)
  const [expandedSubsections, setExpandedSubsections] = useState({})

  // 서브섹션 토글 함수
  const toggleSubsection = (sectionIndex, subIndex) => {
    const key = `${sectionIndex}-${subIndex}`
    setExpandedSubsections(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // 서브섹션이 확장되어 있는지 확인 (기본값: 모두 확장)
  const isSubsectionExpanded = (sectionIndex, subIndex) => {
    const key = `${sectionIndex}-${subIndex}`
    return expandedSubsections[key] !== false // 기본값 true
  }

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
      // completed 상태로 변경될 때만 completedAt과 completedBy 저장
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : null,
      completedBy: nextStatus === 'completed' ? (currentUser?.nickname || null) : null
    }
    // zustand 스토어를 통해 업데이트 (자동으로 리렌더링됨)
    await updateTimelineItem(siteId, itemId, updates)
  }

  const handleDateChange = async (itemId, dates) => {
    const updates = {
      startDate: dates.startDate || null,
      completionDate: dates.completionDate || null
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}.${day}`
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
    return <div className="p-8">프로젝트를 찾을 수 없습니다.</div>
  }

  const sections = [...new Set(site.timeline.map(item => item.section))]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6">
          {/* Mobile: 점검 리스트 버튼을 상단에 배치 */}
          <div className="flex items-center justify-between mb-4 md:hidden">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex-shrink-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">프로젝트 목록으로</span>
            </Button>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate(`/site/${siteId}/checklist`)}
                className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                <ListChecks className="mr-2 h-4 w-4" />
                점검 리스트
              </Button>
              <Button
                variant="outline"
                onClick={() => exportTimelineToExcel(site)}
                size="icon"
                title="엑셀로 출력"
              >
                <FileSpreadsheet className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                size="icon"
              >
                <LogIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Desktop: 기존 레이아웃 */}
          <div className="hidden md:flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              프로젝트 목록으로
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
            >
              <LogIn className="mr-2 h-4 w-4" />
              로그인
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <span className="w-1 h-8 bg-primary rounded-full"></span>
                {site.name} 프로젝트 타임라인
              </h1>
              <p className="text-muted-foreground ml-4 text-sm sm:text-base">타임라인 항목을 클릭하여 상태를 변경할 수 있습니다</p>
            </div>
            <div className="hidden md:flex items-center gap-2 mt-4 md:mt-0">
              <Button
                onClick={() => navigate(`/site/${siteId}/checklist`)}
                className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                <ListChecks className="mr-2 h-4 w-4" />
                점검 리스트
              </Button>
              <Button
                variant="outline"
                onClick={() => exportTimelineToExcel(site)}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                엑셀 출력
              </Button>
            </div>
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
                    <div className="text-xs text-muted-foreground">
                      완료 {progress.completed || 0} / 진행중 {progress.working || 0} / 전체 {progress.total || 0}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <ProgressPieChart
                      value={progress.timeline}
                      name="타임라인"
                      color="rgb(37, 99, 235)"
                      workingValue={progress.total ? (progress.working / progress.total) * 100 : 0}
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
            // 중분류(subsection) 목록 추출
            const subsections = [...new Set(sectionItems.map(item => item.subsection).filter(Boolean))]
            const hasSubsections = subsections.length > 0
            // 한 행에 표시할 항목 수 (반응형)
            const itemsPerRow = 3

            // 아이템 렌더링 함수 (모바일용)
            const renderMobileItem = (item) => {
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

              return (
                <div key={item.id} className="relative flex items-start gap-4">
                  {/* Timeline Node - 좌측 정렬, 세로선 왼쪽에 맞춤 */}
                  <div className="relative z-10 flex-shrink-0 -ml-6">
                    <div className={cn(
                      "flex items-center justify-center w-16 h-16 rounded-full font-bold text-sm shadow-lg border-2 transition-all",
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
                  <div className="flex-1 min-w-0">
                    <Card className={cn(
                      "transition-all duration-200 flex flex-col relative overflow-hidden",
                      "bg-white border border-border/50 rounded-xl",
                      "shadow-sm hover:shadow-md",
                      isCompleted
                        ? "ring-2 ring-blue-500/20 bg-gradient-to-br from-blue-50/50 to-white"
                        : isWorking
                        ? "ring-2 ring-gray-400/20 bg-gradient-to-br from-gray-50/50 to-white"
                        : "hover:ring-2 hover:ring-primary/10"
                    )}>
                      <CardContent className="p-4 flex flex-col gap-3">
                        {/* 상단: 타이틀 (크게, 가운데 정렬) */}
                        <div className="text-center py-3 border-b border-border/30">
                          <h3 className={cn(
                            "font-bold text-lg leading-tight",
                            isCompleted
                              ? "text-blue-600"
                              : isWorking
                              ? "text-gray-700"
                              : "text-foreground"
                          )}>
                            {item.task}
                          </h3>
                        </div>

                        {/* 중단: Role 뱃지 (우측 정렬) */}
                        <div className="flex justify-end gap-2 py-1">
                          {(role === 'rnd' || role === 'both') && (
                            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-semibold shadow-sm">
                              R&D
                            </div>
                          )}
                          {(role === 'field' || role === 'both') && (
                            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold shadow-sm">
                              현장팀
                            </div>
                          )}
                        </div>

                        {/* 하단: 날짜 표시 */}
                        <div className="w-full">
                          <DateRangePicker
                            startDate={item.startDate}
                            completionDate={item.completionDate}
                            onSelect={(dates) => handleDateChange(item.id, dates)}
                            placeholder="기간 선택"
                            className={cn(
                              "w-full h-11 text-sm",
                              (item.startDate || item.completionDate)
                                ? "bg-gray-100 border-gray-300 text-gray-900 font-semibold hover:bg-gray-200 hover:border-gray-400"
                                : ""
                            )}
                          />
                        </div>

                        {/* 하단: 상태 버튼 (전체 폭) */}
                        <button
                          onClick={() => handleStatusChange(item.id, currentStatus)}
                          className={cn(
                            "w-full px-4 py-3 rounded-lg flex items-center justify-between text-sm font-medium transition-all duration-200",
                            "shadow-sm hover:shadow-md",
                            getStatusColor(currentStatus)
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {getStatusIcon(currentStatus)}
                            <span>
                              {currentStatus === 'completed' ? '완료' : currentStatus === 'working' ? '작업중' : '대기'}
                            </span>
                          </div>
                          {isCompleted && (item.completedAt || item.completedBy) && (
                            <div className="flex items-center gap-1.5 text-xs opacity-90">
                              {item.completedBy && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5" />
                                  {item.completedBy}
                                </span>
                              )}
                              {item.completedAt && (
                                <span>({formatCompletedTime(item.completedAt)})</span>
                              )}
                            </div>
                          )}
                        </button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )
            }

            // 아이템 렌더링 함수 (데스크톱용)
            const renderDesktopItem = (item) => {
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

              return (
                <div key={item.id} className="relative flex flex-col items-center h-full">
                  {/* Timeline Node - centered on horizontal line */}
                  <div className="relative z-10 mb-6 -mt-8">
                    <div className={cn(
                      "flex items-center justify-center w-16 h-16 rounded-full font-bold text-sm shadow-lg border-2 transition-all",
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
                      "transition-all duration-200 flex flex-col relative overflow-hidden",
                      "bg-white border border-border/50 rounded-xl",
                      "shadow-sm hover:shadow-md",
                      isCompleted
                        ? "ring-2 ring-blue-500/20 bg-gradient-to-br from-blue-50/50 to-white"
                        : isWorking
                        ? "ring-2 ring-gray-400/20 bg-gradient-to-br from-gray-50/50 to-white"
                        : "hover:ring-2 hover:ring-primary/10"
                    )}>
                      <CardContent className="p-5 flex flex-col gap-3">
                        {/* 상단: 타이틀 (크게, 가운데 정렬) */}
                        <div className="text-center py-3 border-b border-border/30">
                          <h3 className={cn(
                            "font-bold text-lg leading-tight",
                            isCompleted
                              ? "text-blue-600"
                              : isWorking
                              ? "text-gray-700"
                              : "text-foreground"
                          )}>
                            {item.task}
                          </h3>
                        </div>

                        {/* 중단: Role 뱃지 (우측 정렬) */}
                        <div className="flex justify-end gap-2 py-1">
                          {(role === 'rnd' || role === 'both') && (
                            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-semibold shadow-sm">
                              R&D
                            </div>
                          )}
                          {(role === 'field' || role === 'both') && (
                            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold shadow-sm">
                              현장팀
                            </div>
                          )}
                        </div>

                        {/* 하단: 날짜 표시 */}
                        <div className="w-full">
                          <DateRangePicker
                            startDate={item.startDate}
                            completionDate={item.completionDate}
                            onSelect={(dates) => handleDateChange(item.id, dates)}
                            placeholder="기간 선택"
                            className={cn(
                              "w-full h-11",
                              (item.startDate || item.completionDate)
                                ? "text-base bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 hover:border-gray-400"
                                : " text-sm"
                            )}
                          />
                        </div>

                        {/* 하단: 상태 버튼 (전체 폭) */}
                        <button
                          onClick={() => handleStatusChange(item.id, currentStatus)}
                          className={cn(
                            "w-full px-4 py-3 rounded-lg flex items-center justify-between text-sm font-medium transition-all duration-200",
                            "shadow-sm hover:shadow-md",
                            getStatusColor(currentStatus)
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {getStatusIcon(currentStatus)}
                            <span>
                              {currentStatus === 'completed' ? '완료' : currentStatus === 'working' ? '작업중' : '대기'}
                            </span>
                          </div>
                          {isCompleted && (item.completedAt || item.completedBy) && (
                            <div className="flex items-center gap-1.5 text-xs opacity-90">
                              {item.completedBy && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5" />
                                  {item.completedBy}
                                </span>
                              )}
                              {item.completedAt && (
                                <span>({formatCompletedTime(item.completedAt)})</span>
                              )}
                            </div>
                          )}
                        </button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )
            }

            // 데스크톱 행 렌더링 함수
            const renderDesktopRows = (items) => {
              return Array.from({ length: Math.ceil(items.length / itemsPerRow) }).map((_, rowIndex) => {
                const rowItems = items.slice(rowIndex * itemsPerRow, (rowIndex + 1) * itemsPerRow)

                return (
                  <div key={rowIndex} className="relative">
                    {/* Horizontal Timeline Line with gradient on both sides - centered on badge */}
                    <div className="absolute top-0 left-0 right-0 h-1 z-0">
                      <div className="h-full bg-gradient-to-r from-transparent via-primary via-primary/90 to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 relative">
                      {rowItems.map((item) => renderDesktopItem(item))}
                    </div>
                  </div>
                )
              })
            }

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

                {/* 중분류가 있는 경우 */}
                {hasSubsections ? (
                  <div className="space-y-4">
                    {subsections.map((subsection, subIndex) => {
                      const subsectionItems = sectionItems.filter(item => item.subsection === subsection)
                      const isExpanded = isSubsectionExpanded(sectionIndex, subIndex)
                      const completedCount = subsectionItems.filter(item => item.status === 'completed').length
                      const totalCount = subsectionItems.length

                      return (
                        <div key={subsection} className="border border-border/40 rounded-xl overflow-hidden bg-card/50 shadow-sm">
                          {/* Subsection Header - 아코디언 버튼 */}
                          <button
                            onClick={() => toggleSubsection(sectionIndex, subIndex)}
                            className="w-full px-4 py-4 lg:px-6 lg:py-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 text-accent text-sm font-bold shadow-sm border border-accent/30">
                                {sectionIndex + 1}-{subIndex + 1}
                              </div>
                              <h3 className="text-base lg:text-lg font-semibold text-foreground/90">
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
                              {/* 진행률 바 */}
                              <div className="hidden sm:flex items-center gap-2">
                                <div className="w-20 lg:w-32 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all duration-300"
                                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-10">
                                  {Math.round((completedCount / totalCount) * 100)}%
                                </span>
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          </button>

                          {/* Subsection Content - 아코디언 본문 */}
                          {isExpanded && (
                            <div className="px-4 pb-6 pt-4 lg:px-6 lg:pb-8 lg:pt-6 border-t border-border/30 bg-background/50">
                              {/* Mobile/Tablet: Vertical Timeline */}
                              <div className="lg:hidden space-y-8 pl-8 relative">
                                {/* Vertical Timeline Line - Mobile only - positioned left of center */}
                                <div className="absolute left-[38px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-primary via-primary/90 to-transparent"></div>

                                {subsectionItems.map((item) => renderMobileItem(item))}
                              </div>

                              {/* Desktop: Horizontal Timeline Rows (lg and above) */}
                              <div className="hidden lg:block space-y-16 pt-8">
                                {renderDesktopRows(subsectionItems)}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  /* 중분류가 없는 경우 (대시보드 필드 테스트, 준공 및 문서) */
                  <>
                    {/* Mobile/Tablet: Vertical Timeline */}
                    <div className="lg:hidden space-y-8 pl-8 relative">
                      {/* Vertical Timeline Line - Mobile only - positioned left of center */}
                      <div className="absolute left-[38px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-primary via-primary/90 to-transparent"></div>

                      {sectionItems.map((item) => renderMobileItem(item))}
                    </div>

                    {/* Desktop: Horizontal Timeline Rows (lg and above) */}
                    <div className="hidden lg:block space-y-16">
                      {renderDesktopRows(sectionItems)}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
