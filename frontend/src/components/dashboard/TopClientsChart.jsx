import ReactApexChart from "react-apexcharts"

const TopClientsChart = () => {
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
      categories: ["Cliente 1", "Cliente 2", "Cliente 3", "Cliente 4", "Cliente 5"],
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

  // Datos mock — se reemplazarán con datos reales del backend
  const series = [
    {
      name: "Compras",
      data: [12, 9, 7, 5, 3],
    },
  ]

  return (
    <div className="bg-[#130d26] rounded-2xl p-6 flex flex-col gap-2">
      <h3 className="text-white font-semibold">Top 5 Clientes</h3>
      <p className="text-gray-400 text-sm">Por número de compras</p>
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