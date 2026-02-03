import { AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import loginLogo from '../assets/images/login-logo.png';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { supabase } from '../lib/supabase';

export default function SetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({ email: '', group: '' });

  // 현재 세션에서 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserInfo({
          email: session.user.email || '',
          group: session.user.user_metadata?.group || '사업지원팀',
        });
      }
    };
    fetchUserInfo();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      // 1. Auth 비밀번호 업데이트
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || '비밀번호 설정에 실패했습니다.');
        return;
      }

      // 2. app_users 테이블에 사용자 등록 (이메일 @ 앞부분을 id로 사용)
      if (userInfo.email) {
        const userId = userInfo.email.replace(/@.+$/, '');
        const { error: insertError } = await supabase.rpc('register_invited_user', {
          p_id: userId,
          p_email: userInfo.email,
          p_group: userInfo.group,
          p_password: password,
        });

        if (insertError) {
          // 이미 등록된 사용자일 수 있음 (무시)
          console.warn('app_users 등록 실패 (이미 존재할 수 있음):', insertError.message);
        }
      }

      setSuccess(true);
      // 2초 후 메인 페이지로 이동
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } catch (err) {
      setError('비밀번호 설정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <img src={loginLogo} alt="PMS Logo" className="h-16" />
          </div>
          <Card className="w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <h2 className="text-xl font-semibold">비밀번호 설정 완료</h2>
                <p className="text-muted-foreground">
                  비밀번호가 성공적으로 설정되었습니다.
                  <br />
                  잠시 후 메인 페이지로 이동합니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <img src={loginLogo} alt="PMS Logo" className="h-16" />
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">비밀번호 설정</CardTitle>
            <CardDescription className="text-center">
              초대를 수락하셨습니다. 사용할 비밀번호를 설정해 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  비밀번호
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 (6자 이상)"
                    className="w-full pl-10 pr-4 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 다시 입력"
                    className="w-full pl-10 pr-4 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? '설정 중...' : '비밀번호 설정'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
