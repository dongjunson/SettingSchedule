import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/common';
import { ProgressPieChart } from '../components/ProgressChart';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  calculateSiteProgress,
  useCreateSite,
  useDeleteSite,
  useSites,
  useUpdateSite,
} from '../hooks/useQueries';
import { STAGE, USER_GROUPS } from '../lib/constants';
import { useUserStore } from '../lib/userStore';

export default function SiteSelection() {
  const navigate = useNavigate();

  // React Query Hooks
  const { data: sites = [], isLoading, isFetching } = useSites();
  // 초기 로딩(isLoading)이고 데이터가 없을 때만 스피너 표시
  // isFetching은 백그라운드 refetch이므로 스피너를 표시하지 않음
  // 새로고침 시에도 캐시가 없으면 isLoading이 true가 되지만,
  // refetchOnMount: false 설정으로 staleTime 내에서는 불필요한 refetch 방지
  const loading = isLoading && !sites.length;
  const { mutateAsync: deleteSite } = useDeleteSite();
  const { mutateAsync: updateSite, isPending: updating } = useUpdateSite();

  // 사용자 스토어
  const getGroup = useUserStore((state) => state.getGroup);

  const isAdmin = getGroup() === USER_GROUPS.ADMIN;

  const [deletingSiteId, setDeletingSiteId] = useState(null);

  // 수정 모드 상태
  const [editingSiteId, setEditingSiteId] = useState(null);
  const [editingName, setEditingName] = useState('');

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
    try {
      await updateSite({ siteId, updates: { name: editingName.trim() } });
      setEditingSiteId(null);
      setEditingName('');
    } catch (err) {
      window.alert(err?.message || '사업소명 수정에 실패했습니다.');
    }
  };

  // 구축중 단계 프로젝트만 노출
  const sitesWithProgress = useMemo(() => {
    const inProgress = sites.filter((s) => s.stage === STAGE.IN_PROGRESS);
    const mapped = inProgress.map((site) => ({
      ...site,
      progress: calculateSiteProgress(site),
    }));

    return mapped.sort((a, b) => {
      const aCompleted = a.progress.overall === 100;
      const bCompleted = b.progress.overall === 100;

      // 완료된 항목을 뒤로 보냄
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;

      return 0;
    });
  }, [sites]);

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">구축중 프로젝트</h1>
      <p className="text-muted-foreground mb-6">
        현재 구축 중인 프로젝트 목록입니다. 타임라인·체크리스트를 관리할 수 있습니다.
      </p>

      {loading ? (
        <LoadingSpinner message="데이터를 불러오는 중입니다..." fullScreen={false} />
      ) : sitesWithProgress.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            구축중 프로젝트가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-6">
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
  );
}
