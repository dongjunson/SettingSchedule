import { ArrowLeft, Building2, Eye } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useSites, useUpdateSite } from '../hooks/useQueries';
import { STAGE } from '../lib/constants';

export default function AdminHiddenProjectsPage() {
  const navigate = useNavigate();
  const { data: sites = [], isLoading } = useSites();
  const { mutateAsync: updateSite, isPending: updating } = useUpdateSite();
  const [updatingSiteId, setUpdatingSiteId] = useState(null);

  const hiddenSites = sites.filter((s) => s.stage !== STAGE.IN_PROGRESS);

  const handlePromoteToInProgress = async (site) => {
    if (!site?.id) return;
    setUpdatingSiteId(site.id);
    try {
      await updateSite({ siteId: site.id, updates: { stage: STAGE.IN_PROGRESS } });
    } catch (err) {
      window.alert(err?.message || '단계 변경에 실패했습니다.');
    } finally {
      setUpdatingSiteId(null);
    }
  };

  return (
    <div className="py-6">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        구축중 프로젝트로
      </Button>

      <h1 className="text-2xl font-bold text-foreground mb-2">영업중 프로젝트 관리</h1>
      <p className="text-muted-foreground mb-6">
        영업중 단계의 프로젝트입니다. 구축중으로 올리면 메인 목록에 표시됩니다.
      </p>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">데이터를 불러오는 중입니다...</p>
        </div>
      ) : hiddenSites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            영업중 프로젝트가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">영업중 프로젝트 ({hiddenSites.length}건)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {hiddenSites.map((site) => (
                <li
                  key={site.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-muted/50">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{site.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{site.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/site/${site.id}`)}
                    >
                      타임라인
                    </Button>
                    <Button
                      onClick={() => handlePromoteToInProgress(site)}
                      disabled={updating || updatingSiteId === site.id}
                      className="shrink-0"
                    >
                      {updatingSiteId === site.id ? (
                        '처리 중...'
                      ) : (
                        <span className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          구축중으로 올리기
                        </span>
                      )}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
