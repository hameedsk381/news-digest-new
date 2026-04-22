import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border border-neutral-800 px-3 py-2 rounded text-[12px] font-medium shadow-2xl">
        <p className="text-white">
          {label}: <span className="font-bold">{payload[0].value}</span>
        </p>
      </div>
    )
  }
  return null
}

export default function CategoryBarChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-neutral-600 text-xs font-mono uppercase tracking-widest">
        Data Unavailable
      </div>
    )
  }

  const chartData = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="animate-in">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#111" strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#555', fontSize: 10, fontWeight: 600 }}
            axisLine={{ stroke: '#222' }}
            tickLine={false}
            height={50}
            interval={0}
            angle={-30}
            textAnchor="end"
          />
          <YAxis
            tick={{ fill: '#555', fontSize: 10, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={30}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill="#fff"
                fillOpacity={0.8 - (index * 0.05)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
