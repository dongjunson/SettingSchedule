import { ArrowLeft, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useCreateSite } from '../hooks/useQueries';

export default function AdminNewProjectPage() {
  const navigate = useNavigate();
  const { mutateAsync: createSite, isPending: creating } = useCreateSite();
  const [newSiteName, setNewSiteName] = useState('');
  const [createError, setCreateError] = useState('');

  const handleCreateSite = async () => {
    setCreateError('');
    try {
      await createSite({ name: newSiteName });
      setNewSiteName('');
      navigate('/admin/projects');
    } catch (err) {
      setCreateError(err?.message || '사업소 추가에 실패했습니다.');
    }
  };

  return (
    <div className="py-6">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        구축중 프로젝트로
      </Button>

      <h1 className="text-2xl font-bold text-foreground mb-2">신규 프로젝트 등록</h1>
      <p className="text-muted-foreground mb-6">
        프로젝트명 또는 사업소 이름을 입력한 후 추가하기를 클릭하세요.
      </p>

      <div className="max-w-xl space-y-4 p-6 rounded-lg border border-border/60 bg-card">
        <div className="flex flex-row gap-3">
          <input
            value={newSiteName}
            onChange={(e) => setNewSiteName(e.target.value)}
            placeholder="프로젝트명 또는 사업소 이름을 입력하세요"
            className="flex-1 h-11 px-4 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            disabled={creating}
            onKeyDown={(e) => e.key === 'Enter' && newSiteName.trim() && handleCreateSite()}
          />
          <Button
            onClick={handleCreateSite}
            disabled={creating || !newSiteName.trim()}
            className="shadow-lg shadow-primary/20 shrink-0"
          >
            {creating ? (
              '생성 중...'
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                추가하기
              </span>
            )}
          </Button>
        </div>
        {createError && (
          <p className="text-sm text-destructive">{createError}</p>
        )}
      </div>
    </div>
  );
}
