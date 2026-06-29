import { LayoutDashboard, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"
import logoFlowstate from "../../assets/images/flowstate.png"

const Sidebar = () => {
  const navigate = useNavigate()

  return (
    <div className="w-64 bg-gradient-to-b from-[#1a0f3c] to-[#0f0a1e] flex flex-col h-full border-r border-purple-900/30">

      {/* Logo */}
      <div className="p-6 flex items-center">
        <img src={logoFlowstate} alt="Flowstate" className="h-14 object-contain" />
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 space-y-2">
        <div
          onClick={() => navigate("/dashboard/admin")}
          className="flex items-center justify-between px-4 py-3 rounded-xl bg-purple-600 text-white cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-white"></div>
        </div>
        <div
          onClick={() => navigate("/dashboard/admin/equipo")}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-purple-700/20 cursor-pointer transition"
        >
          <Users size={20} />
          <span>Equipo</span>
        </div>
      </nav>

      {/* Perfil abajo */}
      <div className="p-4 border-t border-purple-900/40">
        <div className="flex items-center gap-3 bg-purple-900/30 rounded-xl p-3">
          <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">
            D
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Director</p>
            <p className="text-purple-400 text-xs bg-purple-900/50 px-2 py-0.5 rounded-full inline-block">Director</p>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Sidebar