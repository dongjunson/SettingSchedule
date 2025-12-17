import { CalendarIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export function DateRangePicker({
  startDate,
  completionDate,
  onSelect,
  placeholder = '기간 선택',
  className,
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(
    startDate ? new Date(startDate) : completionDate ? new Date(completionDate) : new Date()
  );
  // 선택 단계: 'idle' (대기) | 'start' (시작일 선택됨, 종료일 대기)
  const [selectionPhase, setSelectionPhase] = useState('idle');
  const [tempStart, setTempStart] = useState(null);

  const handleDateSelect = (selectedDate) => {
    // 날짜를 로컬 시간대 기준으로 정규화 (시간 부분 제거)
    const normalizeDate = (date) => {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    // 정규화된 날짜를 yyyy-MM-dd 문자열로 변환 (timezone 문제 방지)
    const formatLocalDate = (date) => {
      const normalized = normalizeDate(date);
      const year = normalized.getFullYear();
      const month = String(normalized.getMonth() + 1).padStart(2, '0');
      const day = String(normalized.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const selectedNormalized = normalizeDate(selectedDate);

    if (selectionPhase === 'idle') {
      // 첫 번째 클릭: 시작일 선택
      setTempStart(selectedNormalized);
      setSelectionPhase('start');
    } else if (selectionPhase === 'start' && tempStart) {
      // 두 번째 클릭: 종료일 선택
      const tempStartNormalized = normalizeDate(tempStart);

      // 같은 날을 선택하면 시작일과 종료일을 같게 설정
      if (selectedNormalized.getTime() === tempStartNormalized.getTime()) {
        const dateStr = formatLocalDate(tempStartNormalized);
        onSelect({
          startDate: dateStr,
          completionDate: dateStr,
        });
        setOpen(false);
        setSelectionPhase('idle');
        setTempStart(null);
        return;
      }

      // 날짜 순서 정렬 (작은 날짜가 시작일)
      let finalStart = tempStartNormalized;
      let finalEnd = selectedNormalized;

      if (selectedNormalized < tempStartNormalized) {
        finalStart = selectedNormalized;
        finalEnd = tempStartNormalized;
      }

      // 선택 완료 및 저장
      onSelect({
        startDate: formatLocalDate(finalStart),
        completionDate: formatLocalDate(finalEnd),
      });
      setOpen(false);
      setSelectionPhase('idle');
      setTempStart(null);
    }
  };

  const formatDateRange = () => {
    // startDate와 completionDate는 이미 yyyy-MM-dd 형식의 문자열
    if (startDate && completionDate) {
      if (startDate === completionDate) {
        return startDate;
      }
      return `${startDate} ~ ${completionDate}`;
    }
    if (startDate) {
      return startDate;
    }
    return null;
  };

  useEffect(() => {
    if (open) {
      // 달력 열릴 때: 선택 대기 상태로 초기화
      setSelectionPhase('idle');
      setTempStart(null);
      // 기존 날짜가 있으면 해당 월로 이동
      if (startDate) {
        setMonth(new Date(startDate));
      }
    }
  }, [open, startDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-popover-trigger
          className={cn(
            'w-full justify-start text-left font-normal h-11 text-sm',
            'border-border/50 hover:border-primary/50',
            !startDate && !completionDate && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange() || <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" matchTriggerWidth>
        <Calendar
          startDate={
            // 시작일 선택 중이면 기존 범위 숨김
            selectionPhase === 'start' ? null : startDate || null
          }
          endDate={
            // 시작일 선택 중이면 기존 범위 숨김
            selectionPhase === 'start' ? null : completionDate || null
          }
          tempStart={
            // 시작일이 선택되었으면 로컬 날짜 문자열로 전달
            selectionPhase === 'start' && tempStart
              ? `${tempStart.getFullYear()}-${String(tempStart.getMonth() + 1).padStart(2, '0')}-${String(tempStart.getDate()).padStart(2, '0')}`
              : null
          }
          tempEnd={null}
          selectingStart={selectionPhase === 'idle'}
          onSelect={handleDateSelect}
          month={month}
          onMonthChange={setMonth}
        />
      </PopoverContent>
    </Popover>
  );
}
