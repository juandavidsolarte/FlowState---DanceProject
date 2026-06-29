import { useState } from "react"
import { X } from "lucide-react"

const RegistrarUsuarioModal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    rol: "",
  })
  const [errores, setErrores] = useState({})
  const [captchaVerificado, setCaptchaVerificado] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validar = () => {
    const nuevosErrores = {}
    if (!form.nombre) nuevosErrores.nombre = "Requerido"
    if (!form.apellido) nuevosErrores.apellido = "Requerido"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nuevosErrores.email = "Email inválido"
    if (form.telefono.length < 7) nuevosErrores.telefono = "Mínimo 7 dígitos"
    if (!form.rol) nuevosErrores.rol = "Selecciona un rol"
    if (!captchaVerificado) nuevosErrores.captcha = "Verifica que no eres un robot"
    return nuevosErrores
  }

  const handleSubmit = () => {
    const nuevosErrores = validar()
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      return
    }
    // Aquí irá la llamada al backend cuando esté listo
    console.log("Crear usuario", form)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1a1035] rounded-2xl p-8 w-full max-w-lg shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white text-xl font-bold">Registrar nuevo usuario</h2>
            <p className="text-gray-400 text-sm">Completa los datos del nuevo miembro</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <div className="flex flex-col gap-4">

          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Nombre</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ana"
                className="w-full bg-[#0f0a1e] border border-purple-800/40 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition"
              />
              {errores.nombre && <p className="text-red-400 text-xs mt-1">{errores.nombre}</p>}
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Apellido</label>
              <input
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                placeholder="García"
                className="w-full bg-[#0f0a1e] border border-purple-800/40 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition"
              />
              {errores.apellido && <p className="text-red-400 text-xs mt-1">{errores.apellido}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="usuario@flowstate.io"
              className="w-full bg-[#0f0a1e] border border-purple-800/40 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition"
            />
            {errores.email && <p className="text-red-400 text-xs mt-1">{errores.email}</p>}
          </div>

          {/* Teléfono */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Teléfono (mín. 7 dígitos)</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="3001234567"
              className="w-full bg-[#0f0a1e] border border-purple-800/40 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition"
            />
            {errores.telefono && <p className="text-red-400 text-xs mt-1">{errores.telefono}</p>}
          </div>

          {/* Rol */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Rol</label>
            <select
              name="rol"
              value={form.rol}
              onChange={handleChange}
              className="w-full bg-[#0f0a1e] border border-purple-800/40 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition"
            >
              <option value="">Seleccionar rol</option>
              <option value="Admin">Administrador</option>
              <option value="Director">Director</option>
              <option value="Profesor">Profesor</option>
            </select>
            {errores.rol && <p className="text-red-400 text-xs mt-1">{errores.rol}</p>}
          </div>

          {/* CAPTCHA mock */}
          <div className="bg-[#0f0a1e] border border-purple-800/40 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={captchaVerificado}
                onChange={(e) => setCaptchaVerificado(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-white text-sm">No soy un robot</span>
            </div>
            <span className="text-gray-500 text-xs">reCAPTCHA</span>
          </div>
          {errores.captcha && <p className="text-red-400 text-xs">{errores.captcha}</p>}

          {/* Nota contraseña */}
          <p className="text-gray-500 text-xs">Se generará una contraseña temporal automáticamente.</p>

          {/* Botones */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <button
              onClick={onClose}
              className="w-full border border-purple-800/40 text-white py-3 rounded-xl hover:bg-purple-900/20 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Crear Usuario
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default RegistrarUsuarioModal