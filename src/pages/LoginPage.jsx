import { AlertCircle, Info, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import loginLogo from '../assets/images/login-logo.png';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useUserStore } from '../lib/userStore';

const REMEMBER_EMAIL_KEY = 'remembered_user_email';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useUserStore((state) => state.login);

  const rememberedEmail = (() => {
    try {
      return localStorage.getItem(REMEMBER_EMAIL_KEY) || '';
    } catch {
      return '';
    }
  })();

  const [email, setEmail] = useState(rememberedEmail || 'admin@saferobo.co.kr');
  const [rememberEmail, setRememberEmail] = useState(Boolean(rememberedEmail));
  const [password, setPassword] = useState('joy&rising');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        try {
          if (rememberEmail) localStorage.setItem(REMEMBER_EMAIL_KEY, email);
          else localStorage.removeItem(REMEMBER_EMAIL_KEY);
        } catch {
          // ignore storage errors
        }
        navigate('/', { replace: true });
      } else {
        setError(result.error || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* 로고 - 카드 바깥 상단 */}
        <div className="flex justify-center">
          <img src={loginLogo} alt="PMS Logo" className="h-16" />
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">로그인</CardTitle>
            <CardDescription className="text-center">
              이메일과 비밀번호를 입력하여 로그인하세요
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
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  이메일
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@saferobo.co.kr"
                    className="w-full pl-10 pr-4 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

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
                    placeholder="비밀번호를 입력하세요"
                    className="w-full pl-10 pr-4 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground select-none">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) => setRememberEmail(e.target.checked)}
                  disabled={loading}
                />
                이메일 저장
              </label>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? '로그인 중...' : '로그인'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 알림 메시지 */}
        <div className="flex items-center justify-center gap-0 p-4 rounded-lg bg-muted/50 border border-border/60 text-muted-foreground text-sm">
          <Info className="flex-shrink-0 text-muted-foreground mt-1.5 mr-[33px] mb-1.5 ml-1 w-7 h-7" />
          <span className="leading-relaxed box-content mt-0 mb-0">
            본 시스템은 허가받은 사용자만 접근 가능합니다.
            <br />
            이메일 발급 문의 marx@saferobo.co.kr
          </span>
        </div>
      </div>
    </div>
  );
}
