import { ArrowLeft, Mail, Send } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { inviteUserByEmail } from '../lib/api';

const GROUP_OPTIONS = [
  { value: '관리자', label: '관리자' },
  { value: 'R&D', label: 'R&D' },
  { value: '사업지원팀', label: '사업지원팀' },
];

export default function AdminInviteUserPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [group, setGroup] = useState('사업지원팀');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim) {
      setMessage({ type: 'error', text: '이메일을 입력하세요.' });
      return;
    }
    setLoading(true);
    try {
      const result = await inviteUserByEmail(emailTrim, group);
      if (result.ok) {
        setMessage({ type: 'success', text: result.message ?? '초대 메일을 발송했습니다.' });
        setEmail('');
      } else {
        setMessage({ type: 'error', text: result.error ?? '초대에 실패했습니다.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err?.message ?? '요청 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        구축중 프로젝트로
      </Button>

      <h1 className="text-2xl font-bold text-foreground mb-2">사용자 초대</h1>
      <p className="text-muted-foreground mb-6">
        초대할 이메일과 그룹을 선택한 뒤 초대 메일 보내기를 클릭하세요. 수신자가 메일의 링크를 통해 비밀번호를 설정하면 로그인할 수 있습니다.
      </p>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">신규 아이디 초대</CardTitle>
          <CardDescription>이메일 주소로 초대 메일이 발송됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="invite-email" className="text-sm font-medium text-foreground">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@saferobo.co.kr"
                  className="pl-9"
                  disabled={loading}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="invite-group" className="text-sm font-medium text-foreground">
                그룹
              </label>
              <select
                id="invite-group"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                disabled={loading}
              >
                {GROUP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {message.text && (
              <p
                className={`text-sm ${
                  message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-destructive'
                }`}
              >
                {message.text}
              </p>
            )}
            <Button type="submit" disabled={loading} className="gap-2">
              <Send className="h-4 w-4" />
              {loading ? '발송 중...' : '초대 메일 보내기'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
