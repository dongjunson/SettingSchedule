// 타임라인 아이템 카드 - 모바일/데스크톱 공통 컴포넌트
// TimelinePage에서 분리하여 중복 코드를 제거합니다.

import { Check, Clock, User, X } from 'lucide-react';
import { cn, formatCompletedTime, getStatusColor } from '../../lib/utils';
import { DateRangePicker } from '../DateRangePicker';
import { Card, CardContent } from '../ui/card';

/**
 * 상태 아이콘을 ReactElement로 반환
 */
export function StatusIcon({ status }) {
  switch (status) {
    case 'completed':
      return <Check className="h-4 w-4" />;
    case 'working':
      return <Clock className="h-4 w-4" />;
    case 'pending':
      return <X className="h-4 w-4" />;
    default:
      return null;
  }
}

/**
 * 상태 라벨 반환
 */
const getStatusLabel = (status) => {
  switch (status) {
    case 'completed':
      return '완료';
    case 'working':
      return '작업중';
    default:
      return '대기';
  }
};

/**
 * 타임라인 노드 (원형 배지)
 */
function TimelineNode({ step, status, className = '' }) {
  const isCompleted = status === 'completed';
  const isWorking = status === 'working';

  return (
    <div
      className={cn(
        'flex items-center justify-center w-16 h-16 rounded-full font-bold text-sm shadow-lg border-2 transition-all',
        isCompleted
          ? 'bg-blue-500 text-white border-blue-600 shadow-blue-500/40'
          : isWorking
            ? 'bg-gray-500 text-white border-gray-600 shadow-gray-500/30'
            : 'bg-white text-foreground border-border/60 shadow-md',
        className
      )}
    >
      {step}
    </div>
  );
}

/**
 * 타임라인 아이템 카드 내부 콘텐츠 (공통)
 */
function TimelineCardContent({ item, status, onStatusChange, onDateChange, padding = 'p-5' }) {
  const isCompleted = status === 'completed';
  const isWorking = status === 'working';

  return (
    <Card
      className={cn(
        'transition-all duration-200 flex flex-col relative overflow-hidden',
        'bg-white border border-border/50 rounded-xl',
        'shadow-sm hover:shadow-md',
        isCompleted
          ? 'ring-2 ring-blue-500/20 bg-gradient-to-br from-blue-50/50 to-white'
          : isWorking
            ? 'ring-2 ring-gray-400/20 bg-gradient-to-br from-gray-50/50 to-white'
            : 'hover:ring-2 hover:ring-primary/10'
      )}
    >
      <CardContent className={`${padding} flex flex-col gap-3`}>
        {/* 타이틀 */}
        <div className="text-center py-3 border-b border-border/30">
          <h3
            className={cn(
              'font-bold text-lg leading-tight',
              isCompleted ? 'text-blue-600' : isWorking ? 'text-gray-700' : 'text-foreground'
            )}
          >
            {item.task}
          </h3>
        </div>

        {/* 날짜 선택 */}
        <div className="w-full">
          <DateRangePicker
            startDate={item.startDate}
            completionDate={item.completionDate}
            onSelect={(dates) => onDateChange(item.id, dates)}
            placeholder="기간 선택"
            className={cn(
              'w-full h-11',
              item.startDate || item.completionDate
                ? 'text-base bg-gray-100 border-gray-300 text-gray-900 font-semibold hover:bg-gray-200 hover:border-gray-400'
                : 'text-sm'
            )}
          />
        </div>

        {/* 상태 버튼 */}
        <button
          type="button"
          onClick={() => onStatusChange(item.id, status)}
          className={cn(
            'w-full px-4 py-3 rounded-lg flex items-center justify-between text-sm font-medium transition-all duration-200',
            'shadow-sm hover:shadow-md',
            getStatusColor(status)
          )}
        >
          <div className="flex items-center gap-2">
            <StatusIcon status={status} />
            <span>{getStatusLabel(status)}</span>
          </div>
          {isCompleted && (item.completedAt || item.completedBy) && (
            <div className="flex items-center gap-1.5 text-xs opacity-90">
              {item.completedBy && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {item.completedBy}
                </span>
              )}
              {item.completedAt && <span>({formatCompletedTime(item.completedAt)})</span>}
            </div>
          )}
        </button>
      </CardContent>
    </Card>
  );
}

/**
 * 데스크톱 타임라인 아이템
 */
export function DesktopTimelineItem({ item, onStatusChange, onDateChange }) {
  const currentStatus = item.status || 'pending';

  return (
    <div className="relative flex flex-col items-center h-full">
      <div className="relative z-10 mb-6 -mt-8">
        <TimelineNode step={item.step} status={currentStatus} />
      </div>
      <div className="w-full pt-6">
        <TimelineCardContent
          item={item}
          status={currentStatus}
          onStatusChange={onStatusChange}
          onDateChange={onDateChange}
        />
      </div>
    </div>
  );
}

/**
 * 모바일 타임라인 아이템
 */
export function MobileTimelineItem({ item, onStatusChange, onDateChange }) {
  const currentStatus = item.status || 'pending';

  return (
    <div className="relative flex items-start gap-4">
      <div className="relative z-10 flex-shrink-0 -ml-6">
        <TimelineNode step={item.step} status={currentStatus} />
      </div>
      <div className="flex-1 min-w-0">
        <TimelineCardContent
          item={item}
          status={currentStatus}
          onStatusChange={onStatusChange}
          onDateChange={onDateChange}
          padding="p-4"
        />
      </div>
    </div>
  );
}

/**
 * 타임라인 행 렌더링 (3개씩 그리드 배치)
 */
export function TimelineRow({ items, onStatusChange, onDateChange }) {
  return (
    <div className="relative">
      <div className="absolute top-0 left-0 right-0 h-1 z-0">
        <div className="h-full bg-gradient-to-r from-transparent via-primary via-primary/90 to-transparent" />
      </div>
      <div className="grid grid-cols-3 gap-6 relative">
        {items.map((item) => (
          <DesktopTimelineItem
            key={item.id}
            item={item}
            onStatusChange={onStatusChange}
            onDateChange={onDateChange}
          />
        ))}
      </div>
    </div>
  );
}
