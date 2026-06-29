import { useState } from "react"
import RegistrarUsuarioModal from "../../components/dashboard/RegistrarUsuarioModal"

const usuariosMock = [
  { nombre: "Ana", apellido: "García", email: "ana@flowstate.io", rol: "Admin", telefono: "3001234567", activo: true },
  { nombre: "Marcos", apellido: "López", email: "marcos@flowstate.io", rol: "Profesor", telefono: "3007654321", activo: true },
  { nombre: "Valeria", apellido: "Ruiz", email: "valeria@flowstate.io", rol: "Profesor", telefono: "3019876543", activo: false },
  { nombre: "Diego", apellido: "Morales", email: "diego@flowstate.io", rol: "Admin", telefono: "3025551234", activo: true },
  { nombre: "Sofía", apellido: "Herrera", email: "sofia@flowstate.io", rol: "Profesor", telefono: "3031112233", activo: true },
]

const Equipo = () => {
  const [modalAbierto, setModalAbierto] = useState(false)

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Equipo</h1>
          <p className="text-gray-400 text-sm">Gestión de administradores y profesores</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium transition"
        >
          + Registrar Usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-[#130d26] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-gray-400 text-xs uppercase border-b border-purple-900/30">
              <th className="text-left px-6 py-4">Nombre</th>
              <th className="text-left px-6 py-4">Apellido</th>
              <th className="text-left px-6 py-4">Email</th>
              <th className="text-left px-6 py-4">Rol</th>
              <th className="text-left px-6 py-4">Teléfono</th>
              <th className="text-left px-6 py-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {usuariosMock.map((usuario, index) => (
              <tr key={index} className="border-b border-purple-900/10 hover:bg-purple-900/10 transition">
                <td className="px-6 py-4 text-white font-semibold">{usuario.nombre}</td>
                <td className="px-6 py-4 text-gray-400">{usuario.apellido}</td>
                <td className="px-6 py-4 text-gray-400">{usuario.email}</td>
                <td className="px-6 py-4">
                  <span className="bg-purple-900/40 text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-700/40">
                    {usuario.rol}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400">{usuario.telefono}</td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1 text-sm ${usuario.activo ? "text-green-400" : "text-gray-400"}`}>
                    <span className={`w-2 h-2 rounded-full ${usuario.activo ? "bg-green-400" : "bg-gray-400"}`}></span>
                    {usuario.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <RegistrarUsuarioModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
      />

    </div>
  )
}

export default Equipo