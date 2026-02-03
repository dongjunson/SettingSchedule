import { ArrowLeft, Download, Loader2, Plus, Receipt, Save, TrendingUp, Wallet, BadgePercent, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ErrorPage, LoadingSpinner } from '../components/common';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from '../hooks/use-toast';
import { fetchIncomeStatement, fetchSiteById, upsertIncomeStatement } from '../lib/api';
import { exportIncomeStatementToExcel } from '../lib/exportExcel';

const DEFAULT_SALES_ITEMS = ['선금', '잔금'];
const PAYMENT_TYPES = [
  '카드',
  '현금',
  '배달의민족',
  '쿠팡이츠',
  '요기요',
  '제로페이',
  '기타',
  '직접입력',
];
const CUSTOM_PAYMENT_TYPE = '직접입력';

const VARIABLE_EXPENSE_TEMPLATE = {
  수수료: ['실행이행보증보험료', '하자보증보험료', '조달청 시험'],
  이동통신료: ['중계기 LORA USIM', '태블릿 USIM', '모니터링시스템 USIM'],
  'H/W': [
    'Lora 중계기',
    'Lora 중계기 인프라비용',
    'VPN 서버',
    '스마트워치',
    '스마트 비콘',
    '이동형 가스검측기',
    '고정형가스검측기',
    '현장모니터링(태블릿)',
    '운영서버',
    '모니터링시스템',
    '안전모,위치 거치대',
    '잡자재',
  ],
  'S/W': ['운영서버 S/W', '네트워크 SW'],
  판관비: ['판관비'],
  영업비용: ['법률법인', '영업 활동비', '접대비'],
  인건비: ['현장투입인력 m/m'],
};

const createRowId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `row_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const toNumber = (value) => {
  if (value == null || value === '') return 0;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isNaN(n) ? 0 : n;
};

const formatNumber = (value) => {
  if (value == null || Number.isNaN(value)) return '-';
  return value.toLocaleString('ko-KR');
};

// 0원일 때 placeholder 스타일로 표시하는 컴포넌트
const AmountDisplay = ({ value, unit = '원', placeholderClass = 'text-muted-foreground/50' }) => {
  if (value === 0) {
    return <span className={placeholderClass}>0{unit}</span>;
  }
  return <>{formatNumber(value)}{unit}</>;
};

const formatPercent = (value) => `${value.toFixed(2)}%`;

const buildDefaultSalesItems = () =>
  DEFAULT_SALES_ITEMS.map((name, index) => ({
    id: createRowId(),
    type: 'sales',
    groupName: null,
    category: null,
    name,
    amount: '',
    note: '',
    orderIndex: index,
  }));

const buildDefaultExpenseItems = () => {
  const items = [];
  let order = 0;
  for (const [category, names] of Object.entries(VARIABLE_EXPENSE_TEMPLATE)) {
    for (const name of names) {
      items.push({
        id: createRowId(),
        type: 'expense',
        groupName: 'variable',
        category,
        name,
        amount: '',
        note: '',
        orderIndex: order,
      });
      order += 1;
    }
  }
  return items;
};

export default function IncomeStatementManagePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const siteId = searchParams.get('siteId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(''); // 로딩 에러 (페이지 전환)
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [siteName, setSiteName] = useState('');
  const [header, setHeader] = useState({ expectedAmount: '', contractAmount: '' });
  const [salesItems, setSalesItems] = useState([]);
  const [expenseItems, setExpenseItems] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);

  // 스크롤 감지: 일정 이상 스크롤되면 둥근 버튼 표시
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!siteId) {
        setError('사업소 정보가 없습니다.');
        setLoading(false);
        return;
      }
      try {
        // 사업소 정보와 손익계산서 데이터를 병렬로 가져오기
        const [siteData, incomeData] = await Promise.all([
          fetchSiteById(siteId),
          fetchIncomeStatement(siteId),
        ]);

        if (!mounted) return;

        // 사업소명 설정
        setSiteName(siteData?.name ?? siteId);

        if (!incomeData) {
          setHeader({ expectedAmount: '', contractAmount: '' });
          setSalesItems(buildDefaultSalesItems());
          setExpenseItems(buildDefaultExpenseItems());
          setLoading(false);
          return;
        }

        setHeader({
          expectedAmount: incomeData.expectedAmount ? incomeData.expectedAmount.toString() : '',
          contractAmount: incomeData.contractAmount ? incomeData.contractAmount.toString() : '',
        });

        const items = (incomeData.items || [])
          .map((item) => ({
            id: item.id ?? createRowId(),
            type: item.type,
            groupName: item.groupName ?? null,
            category: item.category ?? null,
            name: item.name ?? '',
            amount: item.amount ? String(item.amount) : '',
            note: item.note ?? '',
            paymentType: item.paymentType ?? '',
            spentAt: item.spentAt ?? '',
            description: item.description ?? '',
            orderIndex: item.orderIndex ?? 0,
          }))
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

        const loadedSales = items.filter((item) => item.type === 'sales');
        const loadedExpense = items.filter((item) => item.type === 'expense');

        setSalesItems(loadedSales.length > 0 ? loadedSales : buildDefaultSalesItems());
        setExpenseItems(loadedExpense.length > 0 ? loadedExpense : buildDefaultExpenseItems());
        setLoading(false);
      } catch (err) {
        console.error('Failed to load income statement:', err);
        if (mounted) {
          setError('손익계산서를 불러오지 못했습니다.');
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [siteId]);

  const dataRef = useRef({ header, salesItems, expenseItems });
  dataRef.current = { header, salesItems, expenseItems };

  // 2분마다 자동 저장
  useEffect(() => {
    if (!siteId || loading) return;
    const interval = setInterval(() => {
      performSave(dataRef.current);
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [siteId, loading]);

  const expectedAmount = toNumber(header.expectedAmount);
  const contractAmount = toNumber(header.contractAmount);

  const salesTotal = useMemo(
    () => salesItems.reduce((sum, item) => sum + toNumber(item.amount), 0),
    [salesItems]
  );
  const expenseTotal = useMemo(
    () => expenseItems.reduce((sum, item) => sum + toNumber(item.amount), 0),
    [expenseItems]
  );
  const variableExpenseTotal = useMemo(
    () =>
      expenseItems
        .filter((item) => item.groupName === 'variable')
        .reduce((sum, item) => sum + toNumber(item.amount), 0),
    [expenseItems]
  );
  const fieldOpsExpenseTotal = useMemo(
    () =>
      expenseItems
        .filter((item) => item.groupName === 'field_ops')
        .reduce((sum, item) => sum + toNumber(item.amount), 0),
    [expenseItems]
  );
  const profit = contractAmount - expenseTotal;
  const profitRate = contractAmount > 0 ? (profit / contractAmount) * 100 : 0;

  const ratio = (num, den) => (den > 0 ? (num / den) * 100 : 0);

  const variableExpenseGroups = useMemo(() => {
    const grouped = {};
    for (const item of expenseItems) {
      if (item.groupName !== 'variable') continue;
      const key = item.category || '기타';
      grouped[key] = grouped[key] || [];
      grouped[key].push(item);
    }
    return grouped;
  }, [expenseItems]);

  const fieldOpsItems = expenseItems.filter((item) => item.groupName === 'field_ops');

  const handleHeaderChange = (key, value) => {
    setHeader((prev) => ({ ...prev, [key]: value }));
  };

  const updateItem = (setter, id, patch) => {
    setter((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addSalesItem = () => {
    setSalesItems((prev) => [
      ...prev,
      {
        id: createRowId(),
        type: 'sales',
        groupName: null,
        category: null,
        name: '',
        amount: '',
        note: '',
        orderIndex: prev.length,
      },
    ]);
  };

  const addVariableExpenseItem = (category) => {
    setExpenseItems((prev) => [
      ...prev,
      {
        id: createRowId(),
        type: 'expense',
        groupName: 'variable',
        category,
        name: '',
        amount: '',
        note: '',
        paymentType: '',
        spentAt: '',
        description: '',
        orderIndex: prev.length,
      },
    ]);
  };

  const addFieldOpsItem = () => {
    setExpenseItems((prev) => [
      ...prev,
      {
        id: createRowId(),
        type: 'expense',
        groupName: 'field_ops',
        category: null,
        name: '',
        amount: '',
        note: '',
        paymentType: '',
        spentAt: '',
        description: '',
        orderIndex: prev.length,
      },
    ]);
  };

  const removeItem = (setter, id) => {
    setter((prev) => prev.filter((item) => item.id !== id));
  };

  // 유효성 검사 함수 (저장 전 호출)
  const validateData = (data = dataRef.current) => {
    const { expenseItems: e } = data;

    // 현장 운영비 유효성 검사
    const fieldOpsItems = e.filter((item) => item.groupName === 'field_ops');
    
    // 금액이 없으면 에러
    const noAmount = fieldOpsItems.filter((item) => !item.amount);
    if (noAmount.length > 0) {
      return '현장 운영비 항목에 금액을 입력해 주세요.';
    }
    
    // 날짜가 없으면 에러
    const noDate = fieldOpsItems.filter((item) => !item.spentAt);
    if (noDate.length > 0) {
      return '현장 운영비 항목에 날짜를 선택해 주세요.';
    }
    
    return null;
  };

  const performSave = async (data = dataRef.current) => {
    if (!siteId) return;

    // 유효성 검사
    const validationResult = validateData(data);
    if (validationResult) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: validationResult,
      });
      return;
    }

    setSaving(true);
    try {
      const { header: h, salesItems: s, expenseItems: e } = data;

      const items = [...s, ...e]
        .filter(
          (item) =>
            item.name ||
            item.amount ||
            item.note ||
            item.description ||
            item.paymentType ||
            item.spentAt
        )
        .map((item, index) => ({
          type: item.type,
          groupName: item.groupName,
          category: item.category,
          name: item.name,
          amount: toNumber(item.amount),
          note: item.note,
          paymentType: item.paymentType,
          spentAt: item.spentAt,
          description: item.description,
          orderIndex: index,
        }));

      await upsertIncomeStatement(
        siteId,
        {
          expectedAmount: h.expectedAmount ? toNumber(h.expectedAmount) : null,
          contractAmount: h.contractAmount ? toNumber(h.contractAmount) : null,
        },
        items
      );

      setLastSavedAt(Date.now());
      toast({
        variant: 'success',
        title: '저장 완료',
        description: '손익계산서가 저장되었습니다.',
      });
    } catch (err) {
      console.error('Failed to save income statement:', err);
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: '저장 중 오류가 발생했습니다.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => performSave(dataRef.current);

  const handleExportExcel = () => {
    exportIncomeStatementToExcel({
      siteName,
      header,
      salesItems,
      expenseItems,
      totals: {
        salesTotal,
        variableExpenseTotal,
        fieldOpsExpenseTotal,
        expenseTotal,
        profit,
        profitRate,
      },
    });
    toast({
      variant: 'success',
      title: '엑셀 다운로드',
      description: '손익계산서가 엑셀 파일로 저장되었습니다.',
    });
  };

  if (loading) return <LoadingSpinner message="손익계산서를 불러오는 중입니다..." />;
  if (error) return <ErrorPage title="오류" message={error} onRetry={() => navigate(-1)} />;

  const lastSavedLabel =
    lastSavedAt != null
      ? new Date(lastSavedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : null;

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/income-statement')}
            className="shrink-0"
            title="목록으로"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground truncate">{siteName} 손익계산서</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportExcel}
            className="shrink-0 gap-2"
          >
            <Download className="h-4 w-4" />
            <span>엑셀 저장</span>
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleSave}
            disabled={saving}
            className="shrink-0 gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>저장 중...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>저장</span>
                {lastSavedLabel != null && (
                  <span className="text-xs opacity-80">({lastSavedLabel})</span>
                )}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sticky: 상단 입력 + 자동 계산 + 우측 둥근 저장 버튼 (스크롤 시에만) */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50 shadow-sm pb-4 -mb-4">
        <div className="relative">
          <Card className="border-border/60 shadow-none">
          <CardContent className="p-4 md:p-5 space-y-5">
            {/* 상단 입력 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="expectedAmount"
                  className="text-sm font-medium text-muted-foreground"
                >
                  가예상금액
                </label>
                <Input
                  id="expectedAmount"
                  type="number"
                  value={header.expectedAmount}
                  onChange={(e) => handleHeaderChange('expectedAmount', e.target.value)}
                  placeholder="예: 13000000"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="contractAmount"
                  className="text-sm font-medium text-muted-foreground"
                >
                  계약금액
                </label>
                <Input
                  id="contractAmount"
                  type="number"
                  value={header.contractAmount}
                  onChange={(e) => handleHeaderChange('contractAmount', e.target.value)}
                  placeholder="예: 13770000"
                  className="h-10"
                />
              </div>
            </div>

            {/* 자동 계산 - 가로 배치 + 색상 */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[160px] flex items-center gap-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                  <Wallet className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    매출 합계
                  </p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100 truncate tabular-nums">
                    <AmountDisplay value={salesTotal} placeholderClass="text-blue-400 dark:text-blue-600" />
                  </p>
                </div>
              </div>
              <div className="flex-1 min-w-[240px] flex items-start gap-4 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/50 px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 mt-0.5">
                  <Receipt className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    지출
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline gap-4">
                      <span className="text-xs text-orange-600 dark:text-orange-400">변동비</span>
                      <span className="text-sm font-semibold text-orange-800 dark:text-orange-200 tabular-nums">
                        <AmountDisplay value={variableExpenseTotal} placeholderClass="text-orange-400 dark:text-orange-600" />
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline gap-4">
                      <span className="text-xs text-orange-600 dark:text-orange-400">현장 운영비</span>
                      <span className="text-sm font-semibold text-orange-800 dark:text-orange-200 tabular-nums">
                        <AmountDisplay value={fieldOpsExpenseTotal} placeholderClass="text-orange-400 dark:text-orange-600" />
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-orange-200 dark:border-orange-800">
                    <p className="text-lg font-bold text-orange-900 dark:text-orange-100 tabular-nums">
                      합계 <AmountDisplay value={expenseTotal} placeholderClass="text-orange-400 dark:text-orange-600" />
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-[160px] flex items-center gap-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    손익
                  </p>
                  <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100 truncate tabular-nums">
                    <AmountDisplay value={profit} placeholderClass="text-emerald-400 dark:text-emerald-600" />
                  </p>
                </div>
              </div>
              <div className="flex-1 min-w-[140px] flex items-center gap-4 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/50 px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400">
                  <BadgePercent className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                    수익률
                  </p>
                  <p className="text-lg font-bold text-violet-900 dark:text-violet-100 truncate tabular-nums">
                    {profitRate === 0 ? (
                      <span className="text-violet-400 dark:text-violet-600">0.00%</span>
                    ) : (
                      formatPercent(profitRate)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          {isScrolled && (
            <Button
              type="button"
              variant="default"
              size="icon"
              onClick={handleSave}
              disabled={saving}
              className="absolute -right-16 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg z-10"
              title={lastSavedLabel != null ? `저장 (마지막 저장: ${lastSavedLabel})` : '저장 (2분마다 자동 저장)'}
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">매출</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addSalesItem}>
            <Plus className="h-4 w-4 mr-1" /> 항목 추가
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-1.5 text-xs font-medium text-muted-foreground mb-3">
            <div className="col-span-3">항목명</div>
            <div className="col-span-2">금액</div>
            <div className="col-span-2 text-center">손익대비</div>
            <div className="col-span-2 text-center">매출 내</div>
            <div className="col-span-3">비고</div>
          </div>
          <div className="space-y-3">
            {salesItems.map((item) => {
              const amount = toNumber(item.amount);
              return (
                <div key={item.id} className="grid grid-cols-12 gap-1.5 items-center">
                  <Input
                    className="col-span-3"
                    value={item.name}
                    onChange={(e) => updateItem(setSalesItems, item.id, { name: e.target.value })}
                    placeholder="항목명"
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateItem(setSalesItems, item.id, { amount: e.target.value })}
                    placeholder="0원"
                  />
                  <div className="col-span-2 flex justify-center">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-800 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-100 tabular-nums">
                      손익 {formatPercent(ratio(amount, profit))}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-800 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:text-blue-100 tabular-nums">
                      매출 {formatPercent(ratio(amount, salesTotal))}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      className="flex-1"
                      value={item.note}
                      onChange={(e) => updateItem(setSalesItems, item.id, { note: e.target.value })}
                      placeholder="비고"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(setSalesItems, item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">지출 - 변동비</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(VARIABLE_EXPENSE_TEMPLATE).map((category, idx) => {
            const rows = variableExpenseGroups[category] || [];
            const categoryTotal = rows.reduce((sum, item) => sum + toNumber(item.amount), 0);
            const bgColor = idx % 2 === 0 ? 'bg-muted/30' : 'bg-background';
            return (
              <div key={category} className={`rounded-lg border ${bgColor} overflow-hidden`}>
                <div className="flex">
                  {/* 좌측: 항목 리스트 */}
                  <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b">
                      <h4 className="text-sm font-semibold">{category}</h4>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => addVariableExpenseItem(category)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> 항목 추가
                      </Button>
                    </div>
                    <div className="grid grid-cols-12 gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                      <div className="col-span-3">항목명</div>
                      <div className="col-span-2">금액</div>
                      <div className="col-span-2 text-center">매출대비</div>
                      <div className="col-span-2 text-center">지출대비</div>
                      <div className="col-span-3">비고</div>
                    </div>
                    <div className="space-y-3">
                      {rows.map((item) => {
                        const amount = toNumber(item.amount);
                        return (
                          <div key={item.id} className="grid grid-cols-12 gap-1.5 items-center">
                            <Input
                              className="col-span-3"
                              value={item.name}
                              onChange={(e) =>
                                updateItem(setExpenseItems, item.id, { name: e.target.value })
                              }
                              placeholder="항목명"
                            />
                            <Input
                              className="col-span-2"
                              type="number"
                              value={item.amount}
                              onChange={(e) =>
                                updateItem(setExpenseItems, item.id, { amount: e.target.value })
                              }
                              placeholder="0원"
                            />
                            <div className="col-span-2 flex justify-center">
                              <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-800 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:text-blue-100 tabular-nums">
                                매출 {formatPercent(ratio(amount, contractAmount))}
                              </span>
                            </div>
                            <div className="col-span-2 flex justify-center">
                              <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-800 px-2.5 py-1 text-xs font-semibold text-orange-800 dark:text-orange-100 tabular-nums">
                                지출 {formatPercent(ratio(amount, expenseTotal))}
                              </span>
                            </div>
                            <div className="col-span-3 flex items-center gap-2">
                              <Input
                                className="flex-1 min-w-0"
                                value={item.note}
                                onChange={(e) =>
                                  updateItem(setExpenseItems, item.id, { note: e.target.value })
                                }
                                placeholder="비고"
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="shrink-0"
                                onClick={() => removeItem(setExpenseItems, item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* 우측: 합계 */}
                  <div className="w-36 shrink-0 border-l bg-muted/50 flex flex-col items-center justify-center p-3 gap-2">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">합계</p>
                      <p className="text-base font-bold tabular-nums">
                        <AmountDisplay value={categoryTotal} placeholderClass="text-muted-foreground/50" />
                      </p>
                    </div>
                    <div className="w-full space-y-1.5">
                      <span className="flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800 px-2 py-1 text-[11px] font-semibold text-blue-800 dark:text-blue-100 tabular-nums">
                        매출 {formatPercent(ratio(categoryTotal, contractAmount))}
                      </span>
                      <span className="flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-800 px-2 py-1 text-[11px] font-semibold text-orange-800 dark:text-orange-100 tabular-nums">
                        지출 {formatPercent(ratio(categoryTotal, expenseTotal))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <CardTitle className="text-base">지출 - 현장 운영비</CardTitle>
            <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-800 px-3 py-1 text-xs font-semibold text-orange-800 dark:text-orange-100 tabular-nums">
              합계 <AmountDisplay value={fieldOpsExpenseTotal} placeholderClass="text-orange-500 dark:text-orange-400" />
            </span>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addFieldOpsItem}>
            <Plus className="h-4 w-4 mr-1" /> 항목 추가
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {fieldOpsItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              현장 운영비 내역을 추가해 주세요.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                <div className="col-span-3">지출 종류</div>
                <div className="col-span-2">일자</div>
                <div className="col-span-2">금액</div>
                <div className="col-span-4">상세 내용</div>
                <div className="col-span-1 text-center">삭제</div>
              </div>
              {fieldOpsItems.map((item) => {
                const isCustomMode =
                  item.paymentType !== '' &&
                  (item.paymentType === CUSTOM_PAYMENT_TYPE ||
                    !PAYMENT_TYPES.includes(item.paymentType));
                const dropdownValue =
                  item.paymentType === '' || !PAYMENT_TYPES.includes(item.paymentType)
                    ? ''
                    : item.paymentType;
                return (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-3">
                      {isCustomMode ? (
                        <div className="relative">
                          <Input
                            value={
                              item.paymentType === CUSTOM_PAYMENT_TYPE ? '' : item.paymentType
                            }
                            onChange={(e) =>
                              updateItem(setExpenseItems, item.id, { paymentType: e.target.value })
                            }
                            placeholder="직접 입력"
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => updateItem(setExpenseItems, item.id, { paymentType: '' })}
                          >
                            닫기
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            className="h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-8 text-sm"
                            value={dropdownValue}
                            onChange={(e) => {
                              const value = e.target.value;
                              updateItem(setExpenseItems, item.id, {
                                paymentType:
                                  value === CUSTOM_PAYMENT_TYPE ? CUSTOM_PAYMENT_TYPE : value,
                              });
                            }}
                          >
                            <option value="">선택</option>
                            {PAYMENT_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          <svg
                            className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <Input
                      className="col-span-2"
                      type="date"
                      value={item.spentAt}
                      onChange={(e) =>
                        updateItem(setExpenseItems, item.id, { spentAt: e.target.value })
                      }
                    />
                    <Input
                      className="col-span-2"
                      type="number"
                      value={item.amount}
                      onChange={(e) =>
                        updateItem(setExpenseItems, item.id, { amount: e.target.value })
                      }
                      placeholder="0원"
                    />
                    <Input
                      className="col-span-4"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(setExpenseItems, item.id, { description: e.target.value })
                      }
                      placeholder="상세 내용"
                    />
                    <div className="col-span-1 flex justify-center">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(setExpenseItems, item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 하단 저장 버튼 */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="default"
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>저장 중...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>저장</span>
              {lastSavedLabel != null && (
                <span className="text-xs opacity-80">({lastSavedLabel})</span>
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
