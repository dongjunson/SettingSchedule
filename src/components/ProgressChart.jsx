import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useEffect, useState } from 'react'

export function ProgressPieChart({ value, name, color }) {
  const [chartColors, setChartColors] = useState({
    border: 'rgb(226, 232, 240)',
  })

  useEffect(() => {
    const root = getComputedStyle(document.documentElement)
    setChartColors({
      border: root.getPropertyValue('--border').trim() || 'rgb(226, 232, 240)',
    })
  }, [])

  const data = [
    { name: '완료', value: value, color: color },
    { name: '미완료', value: 100 - value, color: chartColors.border + '40' },
  ]

  return (
    <div className="flex flex-col items-center justify-center">
      <ResponsiveContainer width={80} height={80}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={22}
            outerRadius={36}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
