import ReactApexChart from "react-apexcharts"

const mockData = [
  { genero: "Salsa", cantidad_ventas: 35 },
  { genero: "Bachata", cantidad_ventas: 25 },
  { genero: "Hip-hop", cantidad_ventas: 20 },
  { genero: "Pop", cantidad_ventas: 12 },
  { genero: "Merengue", cantidad_ventas: 8 },
]

const GenreDonutChart = ({ data = mockData, isLoading }) => {
  const chartData = data.length ? data : mockData

  const options = {
    chart: {
      type: "donut",
      background: "transparent",
    },
    theme: { mode: "dark" },
    colors: ["#a855f7", "#7c3aed", "#c084fc", "#6d28d9", "#ddd6fe"],
    labels: chartData.map(item => item.genero),
    legend: {
      labels: {
        colors: "#9ca3af",
      },
    },
    tooltip: {
      theme: "dark",
    },
    dataLabels: {
      enabled: false,
    },
  }

  const series = chartData.map(item => Number(item.cantidad_ventas || 0))

  return (
    <div className="bg-[#130d26] rounded-2xl p-6 flex flex-col gap-2">
      <h3 className="text-white font-semibold">Ventas por Género</h3>

      <p className="text-gray-400 text-sm">
        {isLoading ? "Cargando datos..." : "Distribución"}
      </p>

      <ReactApexChart
        options={options}
        series={series}
        type="donut"
        height={320}
      />
    </div>
  )
}

export default GenreDonutChart
