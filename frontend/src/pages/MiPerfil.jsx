import { useState } from "react"

const usuarioMock = {
  nombre: "Carlos",
  apellido: "Martínez",
  email: "carlos@flowstate.io",
  telefono: "3001234567",
  direccion: "Calle 10 # 5-20, Cali",
}

const comprasMock = [
  { id: 1, coreografia: "Salsa Básica", genero: "Salsa", fecha: "2025-01-15", precio: "$50.000", estado: "Completada" },
  { id: 2, coreografia: "Bachata Sensual", genero: "Bachata", fecha: "2025-02-20", precio: "$45.000", estado: "Completada" },
  { id: 3, coreografia: "Hip-Hop Urbano", genero: "Hip-Hop", fecha: "2025-03-10", precio: "$60.000", estado: "Completada" },
]

const MiPerfil = () => {
  const [tabActivo, setTabActivo] = useState("perfil")
  const [form, setForm] = useState(usuarioMock)
  const [editando, setEditando] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleGuardar = () => {
    console.log("Guardar perfil", form)
    setEditando(false)
  }

  return (
    <div className="min-h-screen bg-[#0f0a1e] text-white px-6 py-10 md:px-20">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
        <p className="text-gray-400 mt-1">Gestiona tu información y revisa tus compras</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-purple-900/30">
        <button
          onClick={() => setTabActivo("perfil")}
          className={`pb-3 px-2 text-sm font-medium transition border-b-2 ${tabActivo === "perfil" ? "border-purple-500 text-white" : "border-transparent text-gray-400 hover:text-white"}`}
        >
          Mi Perfil
        </button>
        <button
          onClick={() => setTabActivo("compras")}
          className={`pb-3 px-2 text-sm font-medium transition border-b-2 ${tabActivo === "compras" ? "border-purple-500 text-white" : "border-transparent text-gray-400 hover:text-white"}`}
        >
          Mis Compras
        </button>
      </div>

      {/* Tab Perfil */}
      {tabActivo === "perfil" && (
        <div className="bg-[#130d26] rounded-2xl p-8 max-w-2xl flex flex-col gap-5">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Nombre</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                disabled={!editando}
                className="w-full bg-[#0f0a1e] border border-purple-800/40 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Apellido</label>
              <input
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                disabled={!editando}
                className="w-full bg-[#0f0a1e] border border-purple-800/40 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-1 block">Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              disabled={!editando}
              className="w-full bg-[#0f0a1e] border border-purple-800/40 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-1 block">Teléfono</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              disabled={!editando}
              className="w-full bg-[#0f0a1e] border border-purple-800/40 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-1 block">Dirección</label>
            <input
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              disabled={!editando}
              className="w-full bg-[#0f0a1e] border border-purple-800/40 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition disabled:opacity-50"
            />
          </div>

          <div className="flex gap-4 mt-2">
            {editando ? (
              <>
                <button
                  onClick={() => setEditando(false)}
                  className="w-full border border-purple-800/40 text-white py-3 rounded-xl hover:bg-purple-900/20 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
                >
                  Guardar cambios
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditando(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
              >
                Editar perfil
              </button>
            )}
          </div>

        </div>
      )}

      {/* Tab Compras */}
      {tabActivo === "compras" && (
        <div className="bg-[#130d26] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 text-xs uppercase border-b border-purple-900/30">
                <th className="text-left px-6 py-4">Coreografía</th>
                <th className="text-left px-6 py-4">Género</th>
                <th className="text-left px-6 py-4">Fecha</th>
                <th className="text-left px-6 py-4">Precio</th>
                <th className="text-left px-6 py-4">Estado</th>
                <th className="text-left px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comprasMock.map((compra) => (
                <tr key={compra.id} className="border-b border-purple-900/10 hover:bg-purple-900/10 transition">
                  <td className="px-6 py-4 text-white font-semibold">{compra.coreografia}</td>
                  <td className="px-6 py-4 text-gray-400">{compra.genero}</td>
                  <td className="px-6 py-4 text-gray-400">{compra.fecha}</td>
                  <td className="px-6 py-4 text-white">{compra.precio}</td>
                  <td className="px-6 py-4">
                    <span className="bg-green-900/30 text-green-400 text-xs px-3 py-1 rounded-full">
                      {compra.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button className="text-purple-400 hover:text-white text-xs border border-purple-700/40 px-3 py-1 rounded-lg transition">
                      Ver video
                    </button>
                    <button className="text-gray-400 hover:text-white text-xs border border-gray-700/40 px-3 py-1 rounded-lg transition">
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}

export default MiPerfil