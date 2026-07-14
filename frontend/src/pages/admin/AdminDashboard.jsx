import { useEffect, useMemo, useState } from "react"
import KPICard from "../../components/dashboard/KPICard"
import DateFilter from "../../components/dashboard/DateFilter"
import SalesLineChart from "../../components/dashboard/SalesLineChart"
import GenreDonutChart from "../../components/dashboard/GenreDonutChart"
import TopClientsChart from "../../components/dashboard/TopClientsChart"
import api from "../../services/api"
import { useAuth } from "../../context/AuthContext"

const mockKpis = [
  { title: "Total Ventas", value: "$0,00", percentage: "+0%", trend: "up" },
  { title: "Total Transacciones", value: "0", percentage: "+0%", trend: "up" },
  { title: "Ticket Promedio", value: "$0,00", percentage: "+0%", trend: "up" },
  { title: "Clientes Únicos", value: "0", percentage: "+0%", trend: "up" },
]

const formatCOP = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))

const formatDateForApi = (date) => {
  if (!date) return ""

  const parsed = new Date(date)
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, "0")
  const day = String(parsed.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const monthLabel = (monthValue) => {
  if (!monthValue) return "—"

  const [year, month] = monthValue.split("-")
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

  return `${monthNames[Number(month) - 1] || month} ${year}`
}

const AdminDashboard = () => {
  const { usuario } = useAuth()
  const [fechaDesde, setFechaDesde] = useState(new Date("2025-01-01"))
  const [fechaHasta, setFechaHasta] = useState(new Date("2025-06-30"))
  const [kpis, setKpis] = useState(mockKpis)
  const [ventasMensuales, setVentasMensuales] = useState([])
  const [ventasPorGenero, setVentasPorGenero] = useState([])
  const [topClientes, setTopClientes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const isAdminRole = ["admin", "director"].includes(usuario?.role)

  const chartData = useMemo(() => {
    const lineCategories = ventasMensuales.map((item) => monthLabel(item.mes))
    const lineSeries = [
      {
        name: "Ventas",
        data: ventasMensuales.map((item) => Number(item.total_ventas || 0)),
      },
    ]

    return {
      lineCategories,
      lineSeries,
    }
  }, [ventasMensuales])

  const loadDashboard = async (desde = fechaDesde, hasta = fechaHasta) => {
    setIsLoading(true)
    setError("")

    try {
      const params = {
        fecha_desde: formatDateForApi(desde),
        fecha_hasta: formatDateForApi(hasta),
      }

      const [kpisResponse, ventasMensualesResponse, ventasPorGeneroResponse, topClientesResponse] = await Promise.all([
        api.get("/dashboard/kpis/"),
        api.get("/dashboard/ventas-mensuales/", { params }),
        api.get("/dashboard/ventas-por-genero/"),
        api.get("/dashboard/top-clientes/"),
      ])

      const kpisData = kpisResponse.data || {}
      setKpis([
        {
          title: "Total Ventas",
          value: formatCOP(kpisData.total_ventas),
          percentage: "+0%",
          trend: "up",
        },
        {
          title: "Total Transacciones",
          value: String(kpisData.total_transacciones ?? 0),
          percentage: "+0%",
          trend: "up",
        },
        {
          title: "Ticket Promedio",
          value: formatCOP(kpisData.ticket_promedio),
          percentage: "+0%",
          trend: "up",
        },
        {
          title: "Clientes Únicos",
          value: String(kpisData.total_clientes_unicos ?? 0),
          percentage: "+0%",
          trend: "up",
        },
      ])

      setVentasMensuales(Array.isArray(ventasMensualesResponse.data) ? ventasMensualesResponse.data : [])
      setVentasPorGenero(Array.isArray(ventasPorGeneroResponse.data) ? ventasPorGeneroResponse.data : [])
      setTopClientes(Array.isArray(topClientesResponse.data) ? topClientesResponse.data : [])
    } catch (fetchError) {
      setError(fetchError.response?.data?.detail || "No se pudieron cargar los datos del dashboard.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAdminRole) {
      loadDashboard()
      return
    }

    if (usuario && !isAdminRole) {
      setError("No tienes permisos para ver este dashboard.")
    }
  }, [isAdminRole, usuario])

  const handleExport = () => {
    const header = ["mes,total_ventas,cantidad_ventas"]
    const rows = ventasMensuales.map((item) => [item.mes, item.total_ventas, item.cantidad_ventas].join(","))
    const csv = [header.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.setAttribute("download", `ventas_mensuales_${formatDateForApi(fechaDesde)}_${formatDateForApi(fechaHasta)}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleApplyDates = () => {
    loadDashboard(fechaDesde, fechaHasta)
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

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
        onApply={handleApplyDates}
        isLoading={isLoading}
      />

      {/* Gráficos */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <SalesLineChart
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            categories={chartData.lineCategories}
            series={chartData.lineSeries}
            isLoading={isLoading}
          />
        </div>
        <div className="col-span-1">
          <GenreDonutChart data={ventasPorGenero} isLoading={isLoading} />
        </div>
      </div>

      {/* Top clientes */}
      <TopClientsChart data={topClientes} isLoading={isLoading} />

    </div>
  )
}

export default AdminDashboard