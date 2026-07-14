import ReactApexChart from "react-apexcharts"

const mockSeries = [
  {
    name: "Ventas",
    data: [10000, 15000, 8000, 22000, 18000, 25000],
  },
]

const mockCategories = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"]

const SalesLineChart = ({ fechaDesde, fechaHasta, categories = mockCategories, series = mockSeries, isLoading }) => {
  const options = {
    chart: {
      type: "line",
      background: "transparent",
      toolbar: { show: false },
    },
    theme: { mode: "dark" },
    stroke: { curve: "smooth", width: 3 },
    colors: ["#a855f7"],
    xaxis: {
      categories: categories.length > 0 ? categories : mockCategories,
      labels: { style: { colors: "#9ca3af" } },
    },
    yaxis: {
      labels: { style: { colors: "#9ca3af" } },
    },
    grid: {
      borderColor: "#ffffff10",
    },
    tooltip: { theme: "dark" },
  }

  return (
    <div className="bg-[#130d26] rounded-2xl p-6 flex flex-col gap-2">
      <h3 className="text-white font-semibold">Ventas últimos 6 meses</h3>
      <p className="text-gray-400 text-sm">{isLoading ? "Cargando datos..." : `${categories[0] || "Ene"} — ${categories[categories.length - 1] || "Jun"}`}</p>
      <ReactApexChart
        options={options}
        series={series}
        type="line"
        height={250}
      />
    </div>
  )
}

export default SalesLineChart