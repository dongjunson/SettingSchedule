import { ArrowLeft, Loader2, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/common';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { deleteAuthUser, getAuthUsers } from '../lib/api';
import { supabase } from '../lib/supabase';

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [appUsersCount, setAppUsersCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentAuthId, setCurrentAuthId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sessionResult, listResult] = await Promise.all([
        supabase.auth.getSession(),
        getAuthUsers(),
      ]);
      const session = sessionResult?.data?.session;
      if (session?.user?.id) setCurrentAuthId(session.user.id);
      if (listResult?.error) {
        setError(listResult.error);
        setUsers([]);
        setAppUsersCount(null);
      } else {
        setUsers(listResult?.users ?? []);
        setAppUsersCount(listResult?.appUsersCount ?? null);
      }
    } catch (err) {
      setError(err?.message ?? '목록을 불러오지 못했습니다.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (user) => {
    if (user.id === currentAuthId) return;
    const confirmed = window.confirm(
      `"${user.email}" 사용자를 삭제하시겠습니까? 삭제 시 해당 계정으로는 더 이상 로그인할 수 없습니다.`
    );
    if (!confirmed) return;
    setDeletingId(user.id);
    try {
      const result = await deleteAuthUser(user.id);
      if (result.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
      } else {
        window.alert(result.error ?? '삭제에 실패했습니다.');
      }
    } catch (err) {
      window.alert(err?.message ?? '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (created_at) => {
    if (!created_at) return '-';
    try {
      const d = new Date(created_at);
      return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('ko-KR');
    } catch {
      return '-';
    }
  };

  return (
    <div className="py-6">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        구축중 프로젝트로
      </Button>

      <h1 className="text-2xl font-bold text-foreground mb-2">사용자 관리</h1>
      <p className="text-muted-foreground mb-6">
        Auth에 등록된 사용자 목록입니다. 관리자는 다른 사용자를 삭제할 수 있습니다. (본인 계정은
        삭제할 수 없습니다.)
      </p>
      {appUsersCount !== null && (
        <p className="text-sm text-muted-foreground mb-6">
          Auth <strong>{users.length}명</strong> · app_users <strong>{appUsersCount}명</strong>
          {users.length !== appUsersCount && (
            <span>
              {' '}
              — 수가 다르면 초대 후 비밀번호 미설정, 또는 app_users만 등록된 계정이 있을 수
              있습니다.
            </span>
          )}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={load} className="mt-4">
              다시 시도
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              등록 사용자 ({users.length}명)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">등록된 사용자가 없습니다.</p>
            ) : (
              <ul className="divide-y divide-border">
                {users.map((user) => {
                  const group = user.user_metadata?.group ?? '-';
                  const isSelf = user.id === currentAuthId;
                  return (
                    <li
                      key={user.id}
                      className="flex flex-row items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground truncate">{user.email}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          그룹: {group} · 가입: {formatDate(user.created_at)}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isSelf ? (
                          <span className="text-xs text-muted-foreground px-3 py-1.5 rounded-md bg-muted/50">
                            본인
                          </span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                            onClick={() => handleDelete(user)}
                            disabled={deletingId !== null}
                          >
                            {deletingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-1.5" />
                                삭제
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
