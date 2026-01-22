import { useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Skeleton } from './ui/skeleton';

export function ProgressPieChart({ value, name, color, workingValue = 0 }) {
  // 미완료(대기중) 색상 - 밝은 회색 직접 사용 (검은색 방지)
  const pendingColor = 'rgb(209, 211, 214)'; // gray-100 - 매우 밝은 회색
  // 기본 색상 (color가 없을 때 사용)
  const defaultColor = 'rgb(59, 130, 246)'; // blue-500

  // 색상 유효성 검사 및 기본값 설정
  const safeColor = useMemo(() => {
    if (!color || typeof color !== 'string' || color.trim() === '') {
      return defaultColor;
    }
    return color;
  }, [color]);

  // 값 유효성 검사 및 정규화 (NaN, undefined, null 방지)
  const safeValue = useMemo(() => {
    const num = Number(value);
    if (Number.isNaN(num) || !Number.isFinite(num)) return 0;
    return Math.max(0, Math.min(100, num)); // 0-100 범위로 제한
  }, [value]);

  const safeWorkingValue = useMemo(() => {
    const num = Number(workingValue);
    if (Number.isNaN(num) || !Number.isFinite(num)) return 0;
    return Math.max(0, num);
  }, [workingValue]);

  // 완료된 비율에서 working 부분을 분리
  // workingValue가 전달되면 3분할 (완료/진행중/미완료)
  // workingValue가 0이면 기존처럼 2분할 (완료/미완료)
  // 안정적인 데이터 구조를 위해 항상 같은 구조 유지 (0인 항목도 포함)
  const chartData = useMemo(() => {
    const completedValue = safeWorkingValue > 0 ? safeValue - safeWorkingValue * 0.5 : safeValue;
    const workingDisplayValue = safeWorkingValue > 0 ? safeWorkingValue * 0.5 : 0;
    const remainingValue = 100 - safeValue;

    // 최소값(0.01)을 사용하여 항상 차트가 그려지도록 하고 구조 안정화
    const MIN_VALUE = 0.01;

    if (safeWorkingValue > 0) {
      return [
        {
          name: '완료',
          value: Math.max(MIN_VALUE, completedValue),
          color: safeColor,
        },
        {
          name: '진행중',
          value: Math.max(MIN_VALUE, workingDisplayValue),
          color: 'rgb(107, 114, 128)', // gray-500 (진행중이 더 진함)
        },
        {
          name: '미완료',
          value: Math.max(MIN_VALUE, remainingValue),
          color: pendingColor, // 대기중 - 밝은 회색
        },
      ];
    }

    return [
      {
        name: '완료',
        value: Math.max(MIN_VALUE, safeValue),
        color: safeColor,
      },
      {
        name: '미완료',
        value: Math.max(MIN_VALUE, 100 - safeValue),
        color: pendingColor, // 대기중 - 밝은 회색
      },
    ];
  }, [safeWorkingValue, safeValue, safeColor]);

  // 차트는 처음부터 표시 (빈 데이터로라도)
  const [hideSkeleton, setHideSkeleton] = useState(false);

  useEffect(() => {
    // 차트 애니메이션이 끝난 후 스켈레톤 숨기기
    // 애니메이션 duration(600ms) + 약간의 여유 시간
    const timer = setTimeout(() => {
      setHideSkeleton(true);
    }, 600 + 50); // 650ms 후 스켈레톤 숨김

    return () => clearTimeout(timer);
  }, []); // 마운트 시 한 번만 실행

  return (
    <div
      className="flex flex-col items-center justify-center relative"
      style={{ width: '80px', height: '80px' }}
    >
      {/* Skeleton - 배경으로 항상 표시, 애니메이션 끝난 후 투명해짐 */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          hideSkeleton ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <Skeleton className="w-20 h-20 rounded-full" />
      </div>

      {/* Chart - 항상 표시 (빈 데이터로라도) */}
      <div className="relative z-10 pointer-events-none" style={{ width: '80px', height: '80px' }}>
        <ResponsiveContainer width={80} height={80}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={22}
              outerRadius={36}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={true}
              animationDuration={600}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}-${index}`}
                  fill={entry.color}
                  stroke={entry.color}
                  strokeWidth={0}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
