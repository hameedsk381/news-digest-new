import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = {
  Positive: '#ffffff',
  Negative: '#444444',
  Neutral: '#888888',
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-black border border-neutral-800 px-3 py-2 rounded text-[12px] font-medium shadow-2xl">
        <p className="text-white">
          {data.name}: <span className="font-bold">{data.value}</span>
        </p>
      </div>
    )
  }
  return null
}

export default function SentimentPieChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-neutral-600 text-xs font-mono uppercase tracking-widest">
        No Data Stream
      </div>
    )
  }

  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
    fill: COLORS[name] || '#222',
  }))

  return (
    <div className="animate-in">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
            stroke="#000"
            strokeWidth={1}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            formatter={(value) => (
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 ml-1">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
