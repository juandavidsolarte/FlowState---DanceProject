import { TrendingUp, TrendingDown } from "lucide-react"

const KPICard = ({ title, value, percentage, trend }) => {
  const isPositive = trend === "up"

  return (
    <div className="bg-[#130d26] rounded-2xl p-6 flex flex-col gap-4">
      
    {/* Título e ícono */}
<div className="flex items-center justify-between">
  <span className="text-gray-400 text-sm">{title}</span>
  <div className="bg-purple-700/30 rounded-lg p-2">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" />
</svg>
  </div>
</div>

      {/* Valor y porcentaje */}
      <div className="flex items-center justify-between">
        <span className="text-white text-2xl font-bold">{value}</span>
        <span className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-lg ${isPositive ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {percentage}
        </span>
      </div>

      {/* Mini línea decorativa */}
      <div className="h-10 flex items-end">
        <div className="w-full h-px bg-purple-700/40 rounded"></div>
      </div>

    </div>
  )
}

export default KPICard