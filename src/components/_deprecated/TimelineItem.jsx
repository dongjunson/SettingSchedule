import { Check, Clock, User, X } from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';
import { Card, CardContent } from './ui/card';
import { STATUS, STATUS_LABELS } from '../lib/constants';
import {
  cn,
  formatCompletedTime,
  getStatusColor,
} from '../lib/utils';

// 상태 아이콘 반환
const getStatusIcon = (status) => {
  switch (status) {
    case STATUS.COMPLETED:
      return <Check className="h-4 w-4" />;
    case STATUS.WORKING:
      return <Clock className="h-4 w-4" />;
    default:
      return <X className="h-4 w-4" />;
  }
};

/**
 * 타임라인 항목 컴포넌트
 * @param {Object} props
 * @param {Object} props.item - 타임라인 항목 데이터
 * @param {Function} props.onStatusChange - 상태 변경 핸들러 (itemId, currentStatus) => void
 * @param {Function} props.onDateChange - 날짜 변경 핸들러 (itemId, dates) => void
 * @param {'mobile' | 'desktop'} props.variant - 레이아웃 변형 (기본: 'desktop')
 */
export function TimelineItem({
  item,
  onStatusChange,
  onDateChange,
  variant = 'desktop',
}) {
  const currentStatus = item.status || STATUS.PENDING;
  const isCompleted = currentStatus === STATUS.COMPLETED;
  const isWorking = currentStatus === STATUS.WORKING;

  // 공통 카드 내용
  const cardContent = (
    <CardContent className={variant === 'mobile' ? 'p-4 flex flex-col gap-3' : 'p-5 flex flex-col gap-3'}>
      {/* 상단: 타이틀 */}
      <div className="text-center py-3 border-b border-border/50">
        <h3
          className={cn(
            'font-bold text-base leading-tight',
            isCompleted
              ? 'text-blue-600'
              : isWorking
                ? 'text-gray-600'
                : 'text-foreground'
          )}
        >
          {item.task}
        </h3>
      </div>

      {/* 하단: 날짜 표시 */}
      <div className="w-full">
        <DateRangePicker
          startDate={item.startDate}
          completionDate={item.completionDate}
          onSelect={(dates) => onDateChange(item.id, dates)}
          placeholder="기간 선택"
          className={cn(
            'w-full h-10 text-sm',
            item.startDate || item.completionDate
              ? 'bg-muted/50 border-muted-foreground/30 text-foreground font-medium'
              : ''
          )}
        />
      </div>

      {/* 하단: 상태 버튼 */}
      <button
        type="button"
        onClick={() => onStatusChange(item.id, currentStatus)}
        className={cn(
          'w-full px-4 py-2 rounded-lg flex items-center justify-between text-sm font-medium transition-all',
          getStatusColor(currentStatus)
        )}
      >
        <div className="flex items-center gap-2">
          {getStatusIcon(currentStatus)}
          <span>{STATUS_LABELS[currentStatus] || STATUS_LABELS[STATUS.PENDING]}</span>
        </div>
        {isCompleted && (item.completedAt || item.completedBy) && (
          <div className="flex items-center gap-1.5 text-xs opacity-90">
            {item.completedBy && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {item.completedBy}
              </span>
            )}
            {item.completedAt && (
              <span>({formatCompletedTime(item.completedAt)})</span>
            )}
          </div>
        )}
      </button>
    </CardContent>
  );

  // 공통 카드 스타일
  const cardClassName = cn(
    'transition-all duration-200 flex flex-col relative overflow-hidden',
    'bg-card border border-border/60',
    'shadow-lg hover:shadow-xl',
    isCompleted
      ? 'ring-2 ring-blue-500/30 bg-gradient-to-br from-blue-50/50 to-transparent'
      : isWorking
        ? 'ring-2 ring-gray-400/30 bg-gradient-to-br from-gray-50/50 to-transparent'
        : 'hover:ring-2 hover:ring-primary/20'
  );

  // 공통 노드 스타일
  const nodeClassName = cn(
    'flex items-center justify-center w-14 h-14 rounded-xl font-bold text-sm shadow-lg border-2 transition-all',
    isCompleted
      ? 'bg-blue-500 text-white border-blue-400 shadow-blue-500/30'
      : isWorking
        ? 'bg-gray-500 text-white border-gray-400 shadow-gray-500/30'
        : 'bg-card text-muted-foreground border-border shadow-md'
  );

  if (variant === 'mobile') {
    return (
      <div className="relative flex items-start gap-4">
        {/* Timeline Node */}
        <div className="relative z-10 flex-shrink-0 -ml-6">
          <div className={nodeClassName}>
            {item.step}
          </div>
        </div>

        {/* Content Card */}
        <div className="flex-1 min-w-0">
          <Card className={cardClassName}>
            {cardContent}
          </Card>
        </div>
      </div>
    );
  }

  // Desktop variant
  return (
    <div className="relative flex flex-col items-center h-full">
      {/* Timeline Node */}
      <div className="relative z-10 mb-6 -mt-8">
        <div className={nodeClassName}>
          {item.step}
        </div>
      </div>

      {/* Content Card */}
      <div className="w-full pt-6">
        <Card className={cardClassName}>
          {cardContent}
        </Card>
      </div>
    </div>
  );
}
