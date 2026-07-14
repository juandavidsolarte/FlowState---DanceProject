import { useEffect, useState } from "react"
import api from "../services/api"

const emptyProfile = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  avatar_url: "",
  role: "cliente",
}

const formatDateForInput = (value) => {
  if (!value) return ""
  return typeof value === "string" ? value.slice(0, 10) : ""
}

const mapProfile = (user) => ({
  first_name: user?.first_name || "",
  last_name: user?.last_name || "",
  email: user?.email || "",
  phone: user?.phone || "",
  date_of_birth: formatDateForInput(user?.date_of_birth),
  avatar_url: user?.avatar_url || "",
  role: user?.role || "cliente",
})

const MiPerfil = () => {
  const [tabActivo, setTabActivo] = useState("perfil")
  const [form, setForm] = useState(emptyProfile)
  const [editando, setEditando] = useState(false)
  const [perfilCargando, setPerfilCargando] = useState(true)
  const [perfilGuardando, setPerfilGuardando] = useState(false)
  const [perfilError, setPerfilError] = useState(null)
  const [perfilExito, setPerfilExito] = useState(null)

  const [compras, setCompras] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const [filtroFechaInicio, setFiltroFechaInicio] = useState("")
  const [filtroFechaFin, setFiltroFechaFin] = useState("")
  const [filtroGenero, setFiltroGenero] = useState("")

  const cargarPerfil = async () => {
    setPerfilCargando(true)
    setPerfilError(null)

    try {
      const response = await api.get("/users/me/")
      setForm(mapProfile(response.data))
    } catch (err) {
      setPerfilError("No se pudo cargar tu perfil.")
      console.error(err)
    } finally {
      setPerfilCargando(false)
    }
  }

  useEffect(() => {
    cargarPerfil()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleGuardar = async () => {
    setPerfilGuardando(true)
    setPerfilError(null)
    setPerfilExito(null)

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        date_of_birth: form.date_of_birth || null,
        avatar_url: form.avatar_url.trim() || null,
      }

      const response = await api.patch("/users/me/", payload)
      setForm(mapProfile(response.data))
      setEditando(false)
      setPerfilExito("Perfil actualizado correctamente.")
    } catch (err) {
      setPerfilError("No se pudo guardar el perfil. Intenta de nuevo.")
      console.error(err)
    } finally {
      setPerfilGuardando(false)
    }
  }

  const cargarCompras = async () => {
    setCargando(true)
    setError(null)
    try {
      const params = {}
      if (filtroFechaInicio) params.fecha_inicio = filtroFechaInicio
      if (filtroFechaFin) params.fecha_fin = filtroFechaFin
      if (filtroGenero) params.genero = filtroGenero

      const response = await api.get("/sales/clientes/me/compras/", { params })
      const resultados = response.data?.results ?? response.data ?? []
      setCompras(Array.isArray(resultados) ? resultados : [])
    } catch (err) {
      setError("No se pudo cargar el historial de compras.")
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (tabActivo === "compras") {
      cargarCompras()
    }
  }, [tabActivo])

  const handleFiltrar = (e) => {
    e.preventDefault()
    cargarCompras()
  }

  const handleDescargarFactura = async (compraId) => {
    try {
      const response = await api.get(`/sales/clientes/me/compras/${compraId}/factura/`, {
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `factura_flowstate_${compraId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error("Error al descargar factura", err)
      alert("No se pudo descargar la factura.")
    }
  }

  const rolVisible = form.role ? form.role.charAt(0).toUpperCase() + form.role.slice(1) : "Cliente"

  return (
    <div className="min-h-screen bg-[#0f0a1e] text-white px-6 py-10 md:px-20">
      <div className="mb-8">
        <p className="text-purple-400 text-xs uppercase tracking-[0.3em] mb-2">Perfil de cliente</p>
        <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
        <p className="text-gray-400 mt-1">Gestiona tu información y revisa tus compras</p>
      </div>

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

      {tabActivo === "perfil" && (
        <div className="bg-[#130d26] rounded-2xl p-8 max-w-2xl flex flex-col gap-5 border border-purple-900/20 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between gap-4 flex-wrap border-b border-purple-900/20 pb-5">
            <div>
              <p className="text-gray-400 text-sm">{rolVisible}</p>
              <h2 className="text-xl font-semibold text-white">
                {form.first_name || form.last_name ? `${form.first_name} ${form.last_name}`.trim() : "Tu perfil"}
              </h2>
            </div>
            {form.avatar_url ? (
              <img
                src={form.avatar_url}
                alt="Avatar del usuario"
                className="h-16 w-16 rounded-2xl object-cover border border-purple-700/40"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-purple-700/30 border border-purple-700/40 flex items-center justify-center text-lg font-semibold text-white">
                {(form.first_name?.[0] || "") + (form.last_name?.[0] || "")}
              </div>
            )}
          </div>

          {perfilCargando ? (
            <div className="rounded-2xl border border-dashed border-purple-900/40 bg-[#0f0a1e] px-4 py-8 text-center text-gray-400">
              Cargando tu perfil...
            </div>
          ) : (
            <>
              {perfilError && <p className="text-red-400 text-sm">{perfilError}</p>}
              {perfilExito && <p className="text-green-400 text-sm">{perfilExito}</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Nombre</label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    disabled={!editando || perfilGuardando}
                    className="w-full bg-[#0f0a1e] border border-purple-800/40 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Apellido</label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    disabled={!editando || perfilGuardando}
                    className="w-full bg-[#0f0a1e] border border-purple-800/40 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Email</label>
                <input
                  name="email"
                  value={form.email}
                  disabled
                  className="w-full bg-[#0f0a1e] border border-purple-800/40 text-white rounded-xl px-4 py-3 outline-none opacity-60"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Teléfono</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={!editando || perfilGuardando}
                    className="w-full bg-[#0f0a1e] border border-purple-800/40 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Fecha de nacimiento</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={form.date_of_birth}
                    onChange={handleChange}
                    disabled={!editando || perfilGuardando}
                    className="w-full bg-[#0f0a1e] border border-purple-800/40 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Avatar URL</label>
                <input
                  name="avatar_url"
                  value={form.avatar_url}
                  onChange={handleChange}
                  disabled={!editando || perfilGuardando}
                  placeholder="https://..."
                  className="w-full bg-[#0f0a1e] border border-purple-800/40 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition disabled:opacity-50"
                />
              </div>

              <div className="flex gap-4 mt-2">
                {editando ? (
                  <>
                    <button
                      onClick={() => {
                        setEditando(false)
                        setPerfilExito(null)
                        cargarPerfil()
                      }}
                      disabled={perfilGuardando}
                      className="w-full border border-purple-800/40 text-white py-3 rounded-xl hover:bg-purple-900/20 transition disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleGuardar}
                      disabled={perfilGuardando}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-60"
                    >
                      {perfilGuardando ? "Guardando..." : "Guardar cambios"}
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
            </>
          )}
        </div>
      )}

      {tabActivo === "compras" && (
        <div className="flex flex-col gap-4">
          <form onSubmit={handleFiltrar} className="bg-[#130d26] rounded-2xl p-4 flex items-center gap-4 flex-wrap">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Desde</label>
              <input
                type="date"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
                className="bg-[#0f0a1e] border border-purple-800/40 text-white text-sm rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Hasta</label>
              <input
                type="date"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
                className="bg-[#0f0a1e] border border-purple-800/40 text-white text-sm rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Género</label>
              <input
                type="text"
                placeholder="Ej: Salsa"
                value={filtroGenero}
                onChange={(e) => setFiltroGenero(e.target.value)}
                className="bg-[#0f0a1e] border border-purple-800/40 text-white text-sm rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-5 py-2 rounded-lg transition mt-5"
            >
              Filtrar
            </button>
          </form>

          {cargando && <p className="text-gray-400 px-2">Cargando compras...</p>}
          {error && <p className="text-red-400 px-2">{error}</p>}

          {!cargando && !error && (
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
                  {compras.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-500 py-8">
                        No tienes compras registradas.
                      </td>
                    </tr>
                  ) : (
                    compras.map((compra) => (
                      <tr key={compra.id} className="border-b border-purple-900/10 hover:bg-purple-900/10 transition">
                        <td className="px-6 py-4 text-white font-semibold">
                          {compra.coreografia?.titulo || "Sin título"}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {compra.coreografia?.genero || "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {compra.fecha_compra ? new Date(compra.fecha_compra).toLocaleDateString("es-CO") : "—"}
                        </td>
                        <td className="px-6 py-4 text-white">
                          ${Number(compra.precio_pagado || 0).toLocaleString("es-CO")}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-green-900/30 text-green-400 text-xs px-3 py-1 rounded-full">
                            {compra.estado_display || compra.estado || "Pagada"}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button className="text-purple-400 hover:text-white text-xs border border-purple-700/40 px-3 py-1 rounded-lg transition">
                            Ver video
                          </button>
                          <button
                            onClick={() => handleDescargarFactura(compra.id)}
                            className="text-gray-400 hover:text-white text-xs border border-gray-700/40 px-3 py-1 rounded-lg transition"
                          >
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MiPerfil