import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export default function IncomeStatementManagePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const siteId = searchParams.get('siteId');

  return (
    <div className="py-8">
      <Button variant="ghost" onClick={() => navigate('/income-statement')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        손익계산서로
      </Button>
      <h1 className="text-2xl font-bold text-foreground mb-2">손익계산서 관리메뉴</h1>
      {siteId && (
        <p className="text-muted-foreground mb-2">
          사업소: <span className="font-medium text-foreground">{siteId}</span>
        </p>
      )}
      <p className="text-muted-foreground mb-6">손익계산서 관리 기능이 올라올 예정입니다.</p>
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          준비 중입니다.
        </CardContent>
      </Card>
    </div>
  );
}
