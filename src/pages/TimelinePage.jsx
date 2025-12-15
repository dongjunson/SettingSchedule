import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, Check, X, Clock, ListChecks, ChevronDown, ChevronRight, User } from 'lucide-react'
import { useStore } from '../lib/store'
import { useUserStore } from '../lib/userStore'
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

  // 사용자 스토어
  const currentUser = useUserStore((state) => state.currentUser)
  const setUser = useUserStore((state) => state.setUser)
  const clearUser = useUserStore((state) => state.clearUser)

  // 닉네임 입력 모달 상태
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')

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
    // 닉네임이 없으면 모달 표시
    if (!currentUser?.nickname) {
      setShowNicknameModal(true)
      return
    }

    const nextStatus = getNextStatus(currentStatus)
    const updates = {
      status: nextStatus,
      // completed 상태로 변경될 때만 completedAt과 completedBy 저장
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : null,
      completedBy: nextStatus === 'completed' ? currentUser.nickname : null
    }
    // zustand 스토어를 통해 업데이트 (자동으로 리렌더링됨)
    await updateTimelineItem(siteId, itemId, updates)
  }

  // 닉네임 저장 핸들러
  const handleSaveNickname = () => {
    if (nicknameInput.trim()) {
      setUser(nicknameInput.trim())
      setShowNicknameModal(false)
      setNicknameInput('')
    }
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
    return <div className="p-8">프로젝트를 찾을 수 없습니다.</div>
  }

  const sections = [...new Set(site.timeline.map(item => item.section))]

  return (
    <div className="min-h-screen bg-background">
      {/* 닉네임 입력 모달 */}
      {showNicknameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">닉네임 입력</h3>
            <p className="text-sm text-muted-foreground mb-4">
              상태 변경 시 누가 체크했는지 기록됩니다.
            </p>
            <input
              type="text"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
              placeholder="닉네임을 입력하세요"
              className="w-full px-4 py-2 border border-border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNicknameModal(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleSaveNickname}
                disabled={!nicknameInput.trim()}
                className="flex-1"
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6">
          {/* 사용자 정보 표시 */}
          <div className="flex items-center justify-end mb-4">
            {currentUser?.nickname ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{currentUser.nickname}</span>
                <button
                  onClick={clearUser}
                  className="ml-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  변경
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNicknameModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full hover:bg-muted/80 transition-colors"
              >
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">닉네임 설정</span>
              </button>
            )}
          </div>

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
            <Button
              onClick={() => navigate(`/site/${siteId}/checklist`)}
              className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              <ListChecks className="mr-2 h-4 w-4" />
              점검 리스트
            </Button>
          </div>

          {/* Desktop: 기존 레이아웃 */}
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 hidden md:inline-flex"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            프로젝트 목록으로
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <span className="w-1 h-8 bg-primary rounded-full"></span>
                {site.name} 프로젝트 타임라인
              </h1>
              <p className="text-muted-foreground ml-4 text-sm sm:text-base">타임라인 항목을 클릭하여 상태를 변경할 수 있습니다</p>
            </div>
            <Button 
              onClick={() => navigate(`/site/${siteId}/checklist`)}
              className="hidden md:inline-flex shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all mt-4 md:mt-0"
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
                      "transition-all shadow-md hover:shadow-lg flex flex-col relative",
                      isCompleted
                        ? "border-2 border-blue-500/70 bg-blue-50/60 hover:border-blue-500 hover:bg-blue-50 hover:shadow-blue-500/25"
                        : isWorking
                        ? "border-2 border-gray-300 bg-gray-100 hover:border-gray-400 hover:bg-gray-200 hover:shadow-gray-300/20"
                        : "border-2 border-border/60 bg-white hover:border-primary/40 hover:bg-white hover:shadow-primary/10"
                    )}>
                      {/* Role Badges - 우측 상단 (모바일: 원형 한글자) */}
                      <div className="absolute top-2 right-2 flex flex-row gap-1 lg:flex-col lg:top-3 lg:right-3">
                        {/* R&D 뱃지: role이 'rnd'이거나 'both'일 때만 표시 */}
                        {role === 'rnd' && (
                          <div className="w-7 h-7 rounded-full bg-purple-500 text-white text-xs font-semibold shadow-sm flex items-center justify-center lg:px-3 lg:py-1 lg:w-auto lg:h-auto">
                            <span className="lg:hidden">R</span>
                            <span className="hidden lg:inline">R&D</span>
                          </div>
                        )}
                        {/* 현장팀 뱃지: role이 'field'이거나 'both'일 때만 표시 */}
                        {role === 'field' && (
                          <div className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-semibold shadow-sm flex items-center justify-center lg:px-3 lg:py-1 lg:w-auto lg:h-auto">
                            <span className="lg:hidden">현</span>
                            <span className="hidden lg:inline">현장팀</span>
                          </div>
                        )}
                        {/* Both 뱃지: role이 'both'일 때만 두 뱃지 모두 표시 */}
                        {role === 'both' && (
                          <>
                            <div className="w-7 h-7 rounded-full bg-purple-500 text-white text-xs font-semibold shadow-sm flex items-center justify-center lg:px-3 lg:py-1 lg:w-auto lg:h-auto">
                              <span className="lg:hidden">R</span>
                              <span className="hidden lg:inline">R&D</span>
                            </div>
                            <div className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-semibold shadow-sm flex items-center justify-center lg:px-3 lg:py-1 lg:w-auto lg:h-auto">
                              <span className="lg:hidden">현</span>
                              <span className="hidden lg:inline">현장팀</span>
                            </div>
                          </>
                        )}
                      </div>

                      <CardContent className="px-1 py-4 pr-1 lg:p-4 lg:pr-4 flex flex-col flex-1 h-full">
                        <h3 className={cn(
                          "font-semibold text-lg mb-3 leading-snug text-center flex items-center justify-center flex-1 pr-2",
                          isCompleted
                            ? "text-blue-500"
                            : isWorking
                            ? "text-gray-700"
                            : "text-foreground"
                        )}>
                          {item.task}
                        </h3>

                        <div className="mt-0 relative mx-4 lg:mx-0">
                          <button
                            onClick={() => handleStatusChange(item.id, currentStatus)}
                            className={cn(
                              "w-full px-3 py-2 rounded-lg flex items-center justify-between text-xs font-semibold transition-all min-h-[36px]",
                              getStatusColor(currentStatus)
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {getStatusIcon(currentStatus)}
                              <span className="text-xs">
                                {currentStatus === 'completed' ? '완료' : currentStatus === 'working' ? '작업중' : '대기'}
                              </span>
                            </div>
                            {isCompleted && (item.completedAt || item.completedBy) && (
                              <div className="flex items-center gap-1.5 text-[10px] opacity-90">
                                {item.completedBy && (
                                  <span className="flex items-center gap-0.5">
                                    <User className="w-3 h-3" />
                                    {item.completedBy}
                                  </span>
                                )}
                                {item.completedAt && (
                                  <span>({formatCompletedTime(item.completedAt)})</span>
                                )}
                              </div>
                            )}
                          </button>
                        </div>
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
                          "font-semibold text-base mb-3 leading-snug text-center flex items-center justify-center flex-1",
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
                              "w-full px-3 py-2 rounded-lg flex items-center justify-between text-xs font-semibold transition-all min-h-[36px]",
                              getStatusColor(currentStatus)
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {getStatusIcon(currentStatus)}
                              <span className="text-xs">
                                {currentStatus === 'completed' ? '완료' : currentStatus === 'working' ? '작업중' : '대기'}
                              </span>
                            </div>
                            {isCompleted && (item.completedAt || item.completedBy) && (
                              <div className="flex items-center gap-1.5 text-[10px] opacity-90">
                                {item.completedBy && (
                                  <span className="flex items-center gap-0.5">
                                    <User className="w-3 h-3" />
                                    {item.completedBy}
                                  </span>
                                )}
                                {item.completedAt && (
                                  <span>({formatCompletedTime(item.completedAt)})</span>
                                )}
                              </div>
                            )}
                          </button>
                        </div>
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
