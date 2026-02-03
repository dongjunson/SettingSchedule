import { ArrowLeft, Building2, EyeOff, Loader2, CheckCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useDeleteSite, useSites, useUpdateSite } from '../hooks/useQueries';
import { STAGE } from '../lib/constants';

const STAGE_OPTIONS = [
  {
    value: null,
    label: '영업중',
    buttonLabel: '영업중으로 변경',
    icon: EyeOff,
    variant: 'outline',
    className: 'border-muted-foreground/40 text-muted-foreground hover:bg-muted/60',
  },
  {
    value: STAGE.IN_PROGRESS,
    label: '구축중',
    buttonLabel: '구축중으로 변경',
    icon: Loader2,
    variant: 'default',
    className: '',
  },
  {
    value: STAGE.COMPLETED,
    label: '구축완료',
    buttonLabel: '구축완료로 변경',
    icon: CheckCircle,
    variant: 'secondary',
    className: 'bg-slate-600 text-slate-50 hover:bg-slate-700 border-slate-600 shadow-sm',
  },
];

function StageSection({
  title,
  sites,
  onSetStage,
  updatingSiteId,
  showDeleteButton = false,
  onDeleteSite,
  deletingSiteId,
}) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title} ({sites.length}건)</CardTitle>
      </CardHeader>
      <CardContent>
        {sites.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            해당 단계의 프로젝트가 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {sites.map((site) => (
              <li
                key={site.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 flex-wrap">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-muted/50">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{site.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{site.id}</p>
                  </div>
                  <span className="text-muted-foreground/60 text-xs">·</span>
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
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {showDeleteButton && onDeleteSite && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDeleteSite(site)}
                      disabled={deletingSiteId === site.id}
                    >
                      {deletingSiteId === site.id ? (
                        '삭제 중...'
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Trash2 className="h-3.5 w-3.5" />
                          삭제
                        </span>
                      )}
                    </Button>
                  )}
                  {updatingSiteId === site.id ? (
                    <span className="text-sm text-muted-foreground">처리 중...</span>
                  ) : (
                    STAGE_OPTIONS.filter((opt) => opt.value !== site.stage).map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <Button
                          key={opt.value ?? 'null'}
                          variant={opt.variant}
                          size="sm"
                          className={opt.className}
                          onClick={() => onSetStage(site, opt.value)}
                        >
                          <span className="flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5" />
                            {opt.buttonLabel}
                          </span>
                        </Button>
                      );
                    })
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminProjectManagePage() {
  const navigate = useNavigate();
  const { data: sites = [], isLoading } = useSites();
  const { mutateAsync: updateSite, isPending: updating } = useUpdateSite();
  const { mutateAsync: deleteSite } = useDeleteSite();
  const [updatingSiteId, setUpdatingSiteId] = useState(null);
  const [deletingSiteId, setDeletingSiteId] = useState(null);

  const hiddenSites = sites.filter((s) => s.stage !== STAGE.IN_PROGRESS && s.stage !== STAGE.COMPLETED);
  const inProgressSites = sites.filter((s) => s.stage === STAGE.IN_PROGRESS);
  const completedSites = sites.filter((s) => s.stage === STAGE.COMPLETED);

  const handleSetStage = async (site, stage) => {
    if (!site?.id) return;
    setUpdatingSiteId(site.id);
    try {
      await updateSite({ siteId: site.id, updates: { stage } });
    } catch (err) {
      window.alert(err?.message || '단계 변경에 실패했습니다.');
    } finally {
      setUpdatingSiteId(null);
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

  return (
    <div className="py-6">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        구축중 프로젝트로
      </Button>

      <h1 className="text-2xl font-bold text-foreground mb-2">프로젝트 관리</h1>
      <p className="text-muted-foreground mb-6">
        프로젝트 단계(영업중 / 구축중 / 구축완료)를 변경할 수 있습니다.
      </p>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">데이터를 불러오는 중입니다...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <StageSection
            title="영업중"
            sites={hiddenSites}
            onSetStage={handleSetStage}
            updatingSiteId={updatingSiteId}
            showDeleteButton
            onDeleteSite={handleDeleteSite}
            deletingSiteId={deletingSiteId}
          />
          <StageSection
            title="구축중"
            sites={inProgressSites}
            onSetStage={handleSetStage}
            updatingSiteId={updatingSiteId}
          />
          <StageSection
            title="구축완료"
            sites={completedSites}
            onSetStage={handleSetStage}
            updatingSiteId={updatingSiteId}
          />
        </div>
      )}
    </div>
  );
}
