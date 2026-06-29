import { Sun, Bell } from "lucide-react"

const Header = () => {
  return (
    <div className="h-16 bg-[#130d26] border-b border-purple-900 flex items-center justify-between px-6">
      
      {/* Título */}
      <h1 className="text-white text-xl font-semibold">Dashboard</h1>

      {/* Acciones derecha */}
      <div className="flex items-center gap-4">
        
        {/* Toggle tema */}
        <button className="text-gray-400 hover:text-white transition">
          <Sun size={20} />
        </button>

        {/* Notificaciones */}
        <button className="relative text-gray-400 hover:text-white transition">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
        </button>

        {/* Usuario */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <span className="text-white text-sm">Admin</span>
        </div>

      </div>
    </div>
  )
}

export default Header