import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  const startDate = props.startDate
  const endDate = props.endDate
  const selectingStart = props.selectingStart !== false

  // 날짜를 시간 부분 없이 비교하기 위한 헬퍼 함수
  const normalizeDate = (dateStr) => {
    if (!dateStr) return null
    try {
      // yyyy-MM-dd 형식의 문자열인 경우 직접 파싱 (timezone 문제 방지)
      if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-').map(Number)
        return new Date(year, month - 1, day)
      }
      // ISO 문자열인 경우 (T 포함)
      if (typeof dateStr === 'string' && dateStr.includes('T')) {
        const dateOnly = dateStr.split('T')[0]
        const [year, month, day] = dateOnly.split('-').map(Number)
        return new Date(year, month - 1, day)
      }
      // Date 객체인 경우
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return null
      return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    } catch {
      return null
    }
  }

  // 날짜를 정규화된 형식으로 변환
  const normalizeDay = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }

  const isDateInRange = (date) => {
    const start = normalizeDate(startDate)
    const end = normalizeDate(endDate)
    if (!start || !end) return false
    const dateNormalized = normalizeDay(date)
    const dateTime = dateNormalized.getTime()
    const startTime = start.getTime()
    const endTime = end.getTime()
    // 시작일과 종료일을 포함한 범위
    return dateTime >= startTime && dateTime <= endTime
  }

  const isDateStart = (date) => {
    if (!startDate) return false
    const start = normalizeDate(startDate)
    if (!start) return false
    const dateNormalized = normalizeDay(date)
    return dateNormalized.getTime() === start.getTime()
  }

  const isDateEnd = (date) => {
    if (!endDate) return false
    const end = normalizeDate(endDate)
    if (!end) return false
    const dateNormalized = normalizeDay(date)
    return dateNormalized.getTime() === end.getTime()
  }

  const isDateInTempRange = (date) => {
    const tempStart = props.tempStart
    const tempEnd = props.tempEnd
    if (!tempStart) return false
    
    const start = normalizeDate(tempStart)
    if (!start) return false
    const dateNormalized = normalizeDay(date)
    const dateTime = dateNormalized.getTime()
    const startTime = start.getTime()
    
    if (tempEnd) {
      const end = normalizeDate(tempEnd)
      if (!end) return false
      const endTime = end.getTime()
      // 시작일과 종료일 사이의 날짜 (시작일과 종료일 제외)
      return dateTime > startTime && dateTime < endTime
    }
    // tempEnd가 없으면 tempStart 이후의 날짜만 표시 (tempStart 제외)
    return dateTime > startTime
  }

  return (
    <div className={cn("p-4 bg-white", className)} style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* 헤더: 월 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const newDate = new Date(props.month || new Date())
            newDate.setMonth(newDate.getMonth() - 1)
            props.onMonthChange?.(newDate)
          }}
          className="h-8 w-8 hover:bg-blue-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-base font-semibold text-gray-800">
          {props.month?.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const newDate = new Date(props.month || new Date())
            newDate.setMonth(newDate.getMonth() + 1)
            props.onMonthChange?.(newDate)
          }}
          className="h-8 w-8 hover:bg-blue-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 선택 안내 */}
      <div className="text-center text-xs text-gray-500 mb-3 py-1.5 bg-gray-50 rounded-md">
        {selectingStart ? "시작일을 선택하세요" : "종료일을 선택하세요"}
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-0 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <div
            key={i}
            className={cn(
              "text-center text-xs font-semibold py-2",
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-500"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-0">
        {(() => {
          const currentMonth = props.month || new Date()
          const currentMonthIndex = currentMonth.getMonth()
          const today = new Date()
          return getCalendarDays(currentMonth, showOutsideDays).map((day, i) => {
          const isToday = day.toDateString() === today.toDateString()
          const isOutsideMonth = day.getMonth() !== currentMonthIndex
          const inRange = isDateInRange(day)
          const isStart = isDateStart(day)
          const isEnd = isDateEnd(day)
          const inTempRange = isDateInTempRange(day)
          const dayOfWeek = day.getDay()

          // 임시 시작일/종료일 확인
          const tempStart = normalizeDate(props.tempStart)
          const tempEnd = normalizeDate(props.tempEnd)
          const dayNormalized = normalizeDay(day)
          const isTempStart = tempStart && dayNormalized.getTime() === tempStart.getTime()
          const isTempEnd = tempEnd && dayNormalized.getTime() === tempEnd.getTime()

          // 시작일과 종료일이 같은 경우 확인
          const start = normalizeDate(startDate)
          const end = normalizeDate(endDate)
          const isSameDay = start && end && start.getTime() === end.getTime() && (isStart || isEnd)

          // 스타일 결정
          let wrapperStyle = ""
          let buttonStyle = ""
          let textStyle = ""

          // 종료일 존재 여부 확인 (구간 스타일 적용 조건)
          const hasEndDate = end || tempEnd

          if (isStart || isTempStart) {
            // 시작일: 진한 파란색 원형 배경
            if (isEnd || isSameDay) {
              // 시작일 = 종료일 (같은 날)
              wrapperStyle = ""
              buttonStyle = "bg-blue-600 rounded-full shadow-md"
            } else if (hasEndDate) {
              // 종료일이 있는 경우에만 구간 스타일 적용
              wrapperStyle = "bg-gradient-to-r from-transparent via-blue-100 to-blue-100"
              buttonStyle = "bg-blue-600 rounded-full shadow-md"
            } else {
              // 시작일만 선택된 경우 (종료일 없음) - 구간 스타일 없음
              wrapperStyle = ""
              buttonStyle = "bg-blue-600 rounded-full shadow-md"
            }
            textStyle = "text-white font-bold"
          } else if (isEnd || isTempEnd) {
            // 종료일: 진한 파란색 원형 배경
            wrapperStyle = "bg-gradient-to-r from-blue-100 via-blue-100 to-transparent"
            buttonStyle = "bg-blue-600 rounded-full shadow-md"
            textStyle = "text-white font-bold"
          } else if (inRange) {
            // 구간 내: 연한 파란색 배경 (스트라이프 형태)
            wrapperStyle = "bg-blue-100"
            buttonStyle = "hover:bg-blue-200 rounded-full"
            textStyle = "text-blue-700 font-semibold"
          } else if (inTempRange && hasEndDate) {
            // 임시 범위: 더 연한 배경 (종료일이 있는 경우에만)
            wrapperStyle = "bg-blue-50"
            buttonStyle = "hover:bg-blue-100 rounded-full"
            textStyle = "text-blue-600"
          } else if (isToday && !isOutsideMonth) {
            // 오늘: 테두리 강조
            buttonStyle = "ring-2 ring-blue-400 ring-offset-1 rounded-full hover:bg-gray-100"
            textStyle = "text-blue-600 font-semibold"
          } else if (isOutsideMonth) {
            buttonStyle = "rounded-full"
            textStyle = "text-gray-300"
          } else {
            buttonStyle = "hover:bg-gray-100 rounded-full"
            textStyle = dayOfWeek === 0 ? "text-red-400" : dayOfWeek === 6 ? "text-blue-400" : "text-gray-700"
          }

          return (
            <div
              key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
              className={cn(
                "flex items-center justify-center h-10",
                wrapperStyle
              )}
            >
              <button
                onClick={() => !isOutsideMonth && props.onSelect?.(day)}
                disabled={isOutsideMonth}
                className={cn(
                  "h-9 w-9 text-sm transition-all flex items-center justify-center font-medium tabular-nums",
                  buttonStyle,
                  textStyle,
                  isOutsideMonth && "cursor-default"
                )}
              >
                {day.getDate()}
              </button>
            </div>
          )
        })
        })()}
      </div>

      {/* 선택된 범위 표시 */}
      {(startDate || endDate || props.tempStart) && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">시작:</span>
              <span className="font-semibold text-blue-600">
                {props.tempStart
                  ? normalizeDate(props.tempStart)?.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) || '-'
                  : startDate
                    ? normalizeDate(startDate)?.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) || '-'
                    : '-'
                }
              </span>
            </div>
            <span className="text-gray-300">→</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">종료:</span>
              <span className={cn(
                "font-semibold",
                props.tempStart && !endDate ? "text-gray-400" : "text-blue-600"
              )}>
                {props.tempStart && !endDate
                  ? "선택 중..."
                  : endDate
                    ? normalizeDate(endDate)?.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) || '-'
                    : '-'
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getCalendarDays(month, showOutsideDays = true) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDay = new Date(year, monthIndex, 1)
  const lastDay = new Date(year, monthIndex + 1, 0)
  const firstDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const days = []

  // 이전 달의 날짜들 (일요일 시작이면 이전 달 날짜 없음)
  if (showOutsideDays && firstDayOfWeek > 0) {
    const prevMonthLastDay = new Date(year, monthIndex, 0)
    const daysInPrevMonth = prevMonthLastDay.getDate()
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, monthIndex - 1, daysInPrevMonth - i))
    }
  }

  // 현재 달의 날짜들
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, monthIndex, i))
  }

  // 다음 달의 날짜들 (6주를 채우도록)
  if (showOutsideDays) {
    const totalCells = 42 // 6주 * 7일
    const remainingDays = totalCells - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, monthIndex + 1, i))
    }
  }

  return days
}

Calendar.displayName = "Calendar"

export { Calendar }
