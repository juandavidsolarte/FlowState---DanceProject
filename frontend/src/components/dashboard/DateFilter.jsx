import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Download } from "lucide-react"

const DateFilter = ({ fechaDesde, fechaHasta, onChangeDesdde, onChangeHasta, onExport, onApply, isLoading }) => {
  return (
    <div className="bg-[#130d26] rounded-2xl p-4 flex flex-wrap items-center gap-4">
      
      <span className="text-white font-medium">Período</span>
      
      <span className="text-gray-400 text-sm">Desde</span>
      <DatePicker
        selected={fechaDesde}
        onChange={onChangeDesdde}
        dateFormat="dd/MM/yyyy"
        className="bg-[#0f0a1e] border border-purple-800/40 text-white text-sm rounded-lg px-3 py-2 outline-none cursor-pointer"
      />

      <span className="text-gray-400 text-sm">Hasta</span>
      <DatePicker
        selected={fechaHasta}
        onChange={onChangeHasta}
        dateFormat="dd/MM/yyyy"
        className="bg-[#0f0a1e] border border-purple-800/40 text-white text-sm rounded-lg px-3 py-2 outline-none cursor-pointer"
      />

      <div className="ml-auto">
        <button
          onClick={onApply}
          disabled={isLoading}
          className="mr-3 rounded-lg border border-purple-800/40 bg-[#0f0a1e] px-4 py-2 text-sm text-white transition hover:bg-purple-700/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Cargando..." : "Aplicar"}
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-2 bg-[#0f0a1e] border border-purple-800/40 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-700/20 transition"
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

    </div>
  )
}

export default DateFilter