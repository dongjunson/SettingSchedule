import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
  const createSite = useStore((state) => state.createSite);
  const deleteSite = useStore((state) => state.deleteSite);
  const updateSite = useStore((state) => state.updateSite);

  // 사용자 스토어
  const logout = useUserStore((state) => state.logout);
  const getId = useUserStore((state) => state.getId);
  const getGroup = useUserStore((state) => state.getGroup);

  const isAdmin = getId() === 'admin';

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

  const [newSiteName, setNewSiteName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [deletingSiteId, setDeletingSiteId] = useState(null);

  // 수정 모드 상태
  const [editingSiteId, setEditingSiteId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleCreateSite = async () => {
    setCreateError('');
    setCreating(true);
    try {
      const created = await createSite({ name: newSiteName });
      setNewSiteName('');
      navigate(`/site/${created.id}`);
    } catch (err) {
      setCreateError(err?.message || '사업소 추가에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSite = async (site) => {
    if (!site?.id) return;
    const ok = window.confirm(
      `'${site.name}' 사업소를 삭제할까요?\n(타임라인/체크리스트 데이터도 함께 삭제됩니다)`
    );
    if (!ok) return;

    setDeletingSiteId(site.id);
    try {
      await deleteSite(site.id);
    } catch (err) {
      window.alert(err?.message || '사업소 삭제에 실패했습니다.');
    } finally {
      setDeletingSiteId(null);
    }
  };

  const handleStartEdit = (site) => {
    setEditingSiteId(site.id);
    setEditingName(site.name);
  };

  const handleCancelEdit = () => {
    setEditingSiteId(null);
    setEditingName('');
  };

  const handleSaveEdit = async (siteId) => {
    if (!editingName.trim()) return;
    setUpdating(true);
    try {
      await updateSite(siteId, { name: editingName.trim() });
      setEditingSiteId(null);
      setEditingName('');
    } catch (err) {
      window.alert(err?.message || '사업소명 수정에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  // sites와 진행도 계산을 메모이제이션
  const sitesWithProgress = useMemo(() => {
    const mapped = sites.map((site) => ({
      ...site,
      progress: calculateProgress(site.id),
    }));

    return mapped.sort((a, b) => {
      const aCompleted = a.progress.overall === 100;
      const bCompleted = b.progress.overall === 100;

      // 완료된 항목을 뒤로 보냄
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;

      return 0;
    });
  }, [sites, calculateProgress]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          {/* 헤더 영역 */}
          <div className="mb-6 pb-6 border-b border-border/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <span className="w-1 h-8 bg-primary rounded-full" />
                JRI PMS
              </h1>
              <p className="text-muted-foreground ml-4 text-sm sm:text-base">
                Project Management System
              </p>
            </div>

            {/* User Controls */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
              <div className="text-right hidden sm:block mr-2">
                <div className="text-sm font-semibold text-foreground">{getId()}</div>
                <div className="text-xs text-muted-foreground">{getGroup()}</div>
              </div>
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
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>로그아웃</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Admin Only: 신규 사업소 추가 */}
          {isAdmin && (
            <div className="flex flex-col md:flex-row items-center gap-3 p-4 rounded-lg bg-muted/30">
              <div className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
                신규 프로젝트
              </div>
              <div className="flex-1 w-full flex items-center gap-2">
                <input
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="프로젝트명 또는 사업소 이름을 입력하세요"
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  disabled={creating}
                  onKeyDown={(e) => e.key === 'Enter' && newSiteName.trim() && handleCreateSite()}
                />
                <Button
                  onClick={handleCreateSite}
                  disabled={creating || !newSiteName.trim()}
                  className="shadow-lg shadow-primary/20"
                >
                  {creating ? (
                    '생성 중...'
                  ) : (
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">추가하기</span>
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}
          {createError && (
            <div className="mt-3 px-2 text-sm text-destructive flex items-center gap-2">
              {createError}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground animate-pulse">데이터를 불러오는 중입니다...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sitesWithProgress.map((site) => {
              const isCompleted = site.progress.overall === 100;
              const cardColor = isCompleted ? '#94a3b8' : '#3b82f6';
              const isEditing = editingSiteId === site.id;

              return (
                <Card
                  key={site.id}
                  className={`group relative overflow-hidden transition-all duration-200 cursor-pointer
                    ${
                      isCompleted
                        ? 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:shadow-md'
                        : 'border-border/60 bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10'
                    }
                    shadow-sm
                  `}
                >
                  {/* Completed Badge */}
                  {isCompleted && (
                    <div className="absolute top-4 right-4 z-20">
                      <div className="bg-slate-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        COMPLETED
                      </div>
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div
                          className={`
                          flex-shrink-0 p-3 rounded-xl
                          ${
                            isCompleted
                              ? 'bg-slate-200 text-slate-500'
                              : 'bg-muted/50 text-foreground group-hover:bg-primary/10 group-hover:text-primary'
                          }
                          transition-colors duration-200
                        `}
                        >
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                ref={(el) => el?.focus()}
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="flex-1 min-w-0 h-8 px-2 text-base font-bold rounded border border-primary bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                disabled={updating}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(site.id);
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                disabled={updating || !editingName.trim()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveEdit(site.id);
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                disabled={updating}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelEdit();
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <CardTitle
                                  className={`text-lg font-bold truncate leading-tight ${isCompleted ? 'text-slate-600' : 'text-foreground'}`}
                                >
                                  {site.name}
                                </CardTitle>
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleStartEdit(site);
                                    }}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              <CardDescription
                                className={`text-xs truncate mt-1 ${isCompleted ? 'text-slate-500' : ''}`}
                              >
                                {isCompleted
                                  ? '모든 작업이 완료되었습니다'
                                  : '타임라인 및 체크리스트 관리'}
                              </CardDescription>
                            </>
                          )}
                        </div>
                      </div>

                      {isAdmin && !isEditing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 -mr-2 -mt-2 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={deletingSiteId === site.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteSite(site);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Main Stats Row */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            전체 진행도
                          </div>
                          <div
                            className={`text-3xl font-bold ${isCompleted ? 'text-slate-500' : 'text-primary'}`}
                          >
                            {site.progress.overall}%
                          </div>
                        </div>
                        <ProgressPieChart
                          value={site.progress.overall}
                          name="전체"
                          color={cardColor}
                          workingValue={
                            site.progress.total
                              ? (site.progress.working / site.progress.total) * 100 * 0.7
                              : 0
                          }
                        />
                      </div>

                      {/* Detailed Stats - 구분선으로 분리 */}
                      <div
                        className={`flex items-center justify-between pt-3 border-t ${isCompleted ? 'border-slate-200' : 'border-border/40'}`}
                      >
                        <div className="text-center flex-1">
                          <div
                            className={`text-[11px] ${isCompleted ? 'text-slate-400' : 'text-muted-foreground'}`}
                          >
                            타임라인
                          </div>
                          <div
                            className={`text-sm font-semibold ${isCompleted ? 'text-slate-500' : 'text-foreground'}`}
                          >
                            {site.progress.timeline}%
                          </div>
                        </div>
                        <div
                          className={`w-px h-8 ${isCompleted ? 'bg-slate-200' : 'bg-border/40'}`}
                        />
                        <div className="text-center flex-1">
                          <div
                            className={`text-[11px] ${isCompleted ? 'text-slate-400' : 'text-muted-foreground'}`}
                          >
                            체크리스트
                          </div>
                          <div
                            className={`text-sm font-semibold ${isCompleted ? 'text-slate-500' : 'text-foreground'}`}
                          >
                            {site.progress.checklist}%
                          </div>
                        </div>
                        <div
                          className={`w-px h-8 ${isCompleted ? 'bg-slate-200' : 'bg-border/40'}`}
                        />
                        <div className="text-center flex-1">
                          <div
                            className={`text-[11px] ${isCompleted ? 'text-slate-400' : 'text-muted-foreground'}`}
                          >
                            작업중
                          </div>
                          <div
                            className={`text-sm font-semibold ${isCompleted ? 'text-slate-500' : 'text-foreground'}`}
                          >
                            {site.progress.working || 0}건
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => navigate(`/site/${site.id}`)}
                        className={`w-full ${isCompleted ? 'bg-slate-400 text-white hover:bg-slate-500' : ''}`}
                        variant={isCompleted ? 'default' : 'default'}
                      >
                        <span className="flex items-center justify-center gap-2">
                          프로젝트 열기
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
