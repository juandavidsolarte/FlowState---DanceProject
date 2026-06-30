import { Outlet, useNavigate } from "react-router-dom"
import { Home, User } from "lucide-react"
import logoFlowstate from "../assets/images/flowstate.png"

const usuarioMock = {
  nombre: "Valentina",
  apellido: "Ríos",
  email: "v.rios@email.com",
}

const iniciales = `${usuarioMock.nombre[0]}${usuarioMock.apellido[0]}`

const ClientLayout = () => {
  const navigate = useNavigate()

  return (
    <div className="flex h-screen bg-[#0f0a1e] text-white overflow-hidden">

      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-[#1a0f3c] to-[#0f0a1e] flex flex-col h-full border-r border-purple-900/30">

       {/* Logo */}
<div className="p-6 flex items-center">
  <img src={logoFlowstate} alt="Flowstate" className="h-14 object-contain" />
</div>

        {/* Navegación */}
        <nav className="flex-1 px-4 space-y-2">
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-purple-700/20 cursor-pointer transition"
          >
            <Home size={20} />
            <span>Inicio</span>
          </div>
          <div
            onClick={() => navigate("/mi-perfil")}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-purple-600 text-white cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <User size={20} />
              <span className="font-medium">Mi Perfil</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-white"></div>
          </div>
        </nav>

        {/* Perfil abajo */}
        <div className="p-4 border-t border-purple-900/40">
          <div className="flex items-center gap-3 bg-purple-900/30 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">
              {iniciales}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{usuarioMock.nombre} {usuarioMock.apellido}</p>
              <p className="text-purple-400 text-xs">{usuarioMock.email}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Header */}
        <div className="h-16 bg-[#130d26] border-b border-purple-900/30 flex items-center justify-end px-6">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white cursor-pointer">
            {iniciales}
          </div>
        </div>

        {/* Área de contenido */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

      </div>
    </div>
  )
}

export default ClientLayout