import ReactApexChart from "react-apexcharts"

const mockData = [
  { nombre: "Cliente 1", cantidad_compras: 12 },
  { nombre: "Cliente 2", cantidad_compras: 9 },
  { nombre: "Cliente 3", cantidad_compras: 7 },
  { nombre: "Cliente 4", cantidad_compras: 5 },
  { nombre: "Cliente 5", cantidad_compras: 3 },
]

const TopClientsChart = ({ data = mockData, isLoading }) => {
  const chartData = data.length > 0 ? data : mockData
  const options = {
    chart: {
      type: "bar",
      background: "transparent",
      toolbar: { show: false },
    },
    theme: { mode: "dark" },
    colors: ["#a855f7"],
    plotOptions: {
      bar: {
        borderRadius: 6,
        horizontal: false,
      },
    },
    xaxis: {
      categories: chartData.map((item) => item.nombre),
      labels: { style: { colors: "#9ca3af" } },
    },
    yaxis: {
      labels: { style: { colors: "#9ca3af" } },
    },
    grid: {
      borderColor: "#ffffff10",
    },
    tooltip: { theme: "dark" },
    dataLabels: { enabled: false },
  }
  const series = [
    {
      name: "Compras",
      data: chartData.map((item) => Number(item.cantidad_compras || 0)),
    },
  ]

  return (
    <div className="bg-[#130d26] rounded-2xl p-6 flex flex-col gap-2">
      <h3 className="text-white font-semibold">Top 5 Clientes</h3>
      <p className="text-gray-400 text-sm">{isLoading ? "Cargando datos..." : "Por número de compras"}</p>
      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height={250}
      />
    </div>
  )
}

export default TopClientsChart