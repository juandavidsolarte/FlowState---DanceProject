import { useState } from "react"
import KPICard from "../../components/dashboard/KPICard"
import DateFilter from "../../components/dashboard/DateFilter"
import SalesLineChart from "../../components/dashboard/SalesLineChart"
import GenreDonutChart from "../../components/dashboard/GenreDonutChart"
import TopClientsChart from "../../components/dashboard/TopClientsChart"

const kpis = [
  { title: "KPI 1", value: "—", percentage: "+0%", trend: "up" },
  { title: "KPI 2", value: "—", percentage: "-0%", trend: "down" },
  { title: "KPI 3", value: "—", percentage: "+0%", trend: "up" },
  { title: "KPI 4", value: "—", percentage: "+0%", trend: "up" },
]

const AdminDashboard = () => {
  const [fechaDesde, setFechaDesde] = useState(new Date("2025-01-01"))
  const [fechaHasta, setFechaHasta] = useState(new Date("2025-06-30"))

  const handleExport = () => {
    console.log("Exportar CSV", { fechaDesde, fechaHasta })
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Grid de KPIs */}
      <div className="grid grid-cols-2 gap-4">
        {kpis.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            percentage={kpi.percentage}
            trend={kpi.trend}
          />
        ))}
      </div>

      {/* Filtro de fechas */}
      <DateFilter
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        onChangeDesdde={setFechaDesde}
        onChangeHasta={setFechaHasta}
        onExport={handleExport}
      />

      {/* Gráficos */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <SalesLineChart fechaDesde={fechaDesde} fechaHasta={fechaHasta} />
        </div>
        <div className="col-span-1">
          <GenreDonutChart />
        </div>
      </div>

      {/* Top clientes */}
      <TopClientsChart />

    </div>
  )
}

export default AdminDashboard