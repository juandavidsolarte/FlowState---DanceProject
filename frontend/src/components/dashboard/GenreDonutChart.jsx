import ReactApexChart from "react-apexcharts"

const GenreDonutChart = () => {
  const options = {
    chart: {
      type: "donut",
      background: "transparent",
    },
    theme: { mode: "dark" },
    colors: ["#a855f7", "#7c3aed", "#c084fc", "#6d28d9", "#ddd6fe"],
    labels: ["Salsa", "Bachata", "Hip-hop", "Pop", "Merengue"],
    legend: {
      labels: { colors: "#9ca3af" },
    },
    tooltip: { theme: "dark" },
    dataLabels: { enabled: false },
  }

  // Datos mock — se reemplazarán con datos reales del backend
  const series = [35, 25, 20, 12, 8]

  return (
    <div className="bg-[#130d26] rounded-2xl p-6 flex flex-col gap-2">
      <h3 className="text-white font-semibold">Ventas por Género</h3>
      <p className="text-gray-400 text-sm">Distribución</p>
      <ReactApexChart
        options={options}
        series={series}
        type="donut"
        height={250}
      />
    </div>
  )
}

export default GenreDonutChart