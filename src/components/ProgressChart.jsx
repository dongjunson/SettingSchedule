import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useEffect, useState } from 'react'

export function ProgressPieChart({ value, name, color, workingValue = 0 }) {
  const [chartColors, setChartColors] = useState({
    border: 'rgb(226, 232, 240)',
  })

  useEffect(() => {
    const root = getComputedStyle(document.documentElement)
    setChartColors({
      border: root.getPropertyValue('--border').trim() || 'rgb(226, 232, 240)',
    })
  }, [])

  // 완료된 비율에서 working 부분을 분리
  // workingValue가 전달되면 3분할 (완료/진행중/미완료)
  // workingValue가 0이면 기존처럼 2분할 (완료/미완료)
  const completedValue = workingValue > 0 ? value - (workingValue * 0.5) : value
  const workingDisplayValue = workingValue > 0 ? workingValue * 0.5 : 0
  const remainingValue = 100 - value

  const data = workingValue > 0
    ? [
        { name: '완료', value: Math.max(0, completedValue), color: color },
        { name: '진행중', value: workingDisplayValue, color: 'rgb(156, 163, 175)' }, // gray-400
        { name: '미완료', value: Math.max(0, remainingValue), color: chartColors.border + '40' },
      ]
    : [
        { name: '완료', value: value, color: color },
        { name: '미완료', value: 100 - value, color: chartColors.border + '40' },
      ]

  // 0인 항목 필터링
  const filteredData = data.filter(d => d.value > 0)

  return (
    <div className="flex flex-col items-center justify-center">
      <ResponsiveContainer width={80} height={80}>
        <PieChart>
          <Pie
            data={filteredData.length > 0 ? filteredData : [{ name: '미완료', value: 100, color: chartColors.border + '40' }]}
            cx="50%"
            cy="50%"
            innerRadius={22}
            outerRadius={36}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {(filteredData.length > 0 ? filteredData : [{ name: '미완료', value: 100, color: chartColors.border + '40' }]).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
