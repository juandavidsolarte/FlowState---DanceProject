import React, { Fragment, useRef, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import api from "../services/api";

/**
 * Componente: AuthModal
 * 
 * Este componente representa el modal unificado de autenticación para la plataforma FlowState.
 * Permite a los usuarios tanto iniciar sesión (Login) como registrarse (Registro).
 * Cuenta con un diseño adaptativo premium con estética "Glassmorphism",
 * transiciones fluidas y validaciones dinámicas.
 * 
 * @param {boolean} isOpen - Estado que controla si el modal está visible u oculto.
 * @param {function} closeModal - Función para cerrar el modal y limpiar su estado interno.
 */
const AuthModal = ({ isOpen, closeModal }) => {
  // ==========================================
  // ----------- ESTADOS Y HOOKS --------------
  // ==========================================

  // Referencia para establecer el foco automático al abrir el modal (UX óptima)
  const emailRef = useRef(null);

  // 'mode': Controla el flujo actual del modal. Valores: "login" o "register"
  const [mode, setMode] = useState("login");

  // 'selectedRole': Rol seleccionado en el registro. Valores: "cliente" o "profesor"
  const [selectedRole, setSelectedRole] = useState("cliente");

  // 'loading': Indica si hay una petición HTTP en curso (deshabilita el botón y muestra un spinner)
  const [loading, setLoading] = useState(false);

  // 'error': Almacena mensajes de error devueltos por el backend para mostrarlos en pantalla
  const [error, setError] = useState("");

  // 'success': Almacena mensajes de éxito para retroalimentación visual positiva
  const [success, setSuccess] = useState("");

  /**
   * Hook useEffect: Reseteo de Estados
   * 
   * Se ejecuta cada vez que el modal se abre o se cierra.
   * Su propósito es limpiar cualquier mensaje de error, éxito o estado de carga previo,
   * garantizando que el usuario siempre encuentre el formulario en su estado inicial limpio.
   */
  useEffect(() => {
    if (!isOpen) {
      setError("");
      setSuccess("");
      setLoading(false);
      setSelectedRole("cliente");
    }
  }, [isOpen]);

  // ==========================================
  // ---------- FUNCIONES AUXILIARES ----------
  // ==========================================

  /**
   * Función: formatError
   * 
   * Toma un objeto de error arrojado por Axios y lo procesa.
   * Si el error proviene de Django REST Framework (DRF), formatea los errores de campos
   * (diccionario de listas) traduciendo las claves al español y listando los detalles.
   * 
   * @param {object} err - Objeto de error capturado en el bloque catch.
   * @returns {string} - Mensaje de error formateado y legible para el usuario final.
   */
  const formatError = (err) => {
    if (err.response?.data) {
      const data = err.response.data;
      if (typeof data === "string") return data;
      if (data.detail) return data.detail;

      // Mapea los nombres de variables del backend a etiquetas legibles en español
      return Object.entries(data)
        .map(([field, msgs]) => {
          const fieldName =
            field === "email"
              ? "Correo"
              : field === "password"
                ? "Contraseña"
                : field === "first_name"
                  ? "Nombre"
                  : field === "last_name"
                    ? "Apellido"
                    : field === "phone"
                      ? "Teléfono"
                      : field === "role"
                        ? "Rol"
                        : field;
          // Retorna la etiqueta traducida junto con sus mensajes de error
          return `${fieldName}: ${Array.isArray(msgs) ? msgs.join(" ") : msgs}`;
        })
        .join("\n");
    }
    return err.message || "Ha ocurrido un error inesperado.";
  };

  // ==========================================
  // --------- CONTROLADORES DE EVENTO --------
  // ==========================================

  /**
   * Función: handleSubmit
   * 
   * Controlador de envío del formulario.
   * Evita la recarga por defecto del navegador, recopila la información ingresada,
   * y dependiendo del modo activo ("login" o "register"), realiza la llamada POST
   * correspondiente a la API utilizando la instancia configurada de Axios (`api`).
   * 
   * @param {Event} e - Evento de envío del formulario (submit).
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Extracción de datos del formulario de manera nativa y eficiente
    const form = new FormData(e.target);
    const email = form.get("email");
    const password = form.get("password");

    // --- FLUJO DE REGISTRO ---
    if (mode === "register") {
      const first_name = form.get("first_name");
      const last_name = form.get("last_name");
      const phone = form.get("phone");
      const role = form.get("role");

      setLoading(true);
      try {
        // Petición Axios al endpoint del backend para registrar el usuario
        await api.post("/auth/register/", {
          email,
          password,
          first_name,
          last_name,
          phone,
          role,
        });
        // Si es exitoso, notifica al usuario y lo transiciona al flujo de login
        setSuccess("¡Usuario registrado exitosamente! Ya puedes iniciar sesión.");
        setMode("login");
      } catch (err) {
        // Captura, formatea y muestra los errores del backend (ej: correo duplicado)
        setError(formatError(err));
      } finally {
        setLoading(false);
      }
    }
    // --- FLUJO DE INICIO DE SESIÓN (LOGIN) ---
    else {
      setLoading(true);
      try {
        // Petición Axios al endpoint para autenticar y obtener el token JWT
        // Se envía un token dummy de reCAPTCHA en caso de que esté configurado en el backend
        const recaptcha_token = "dummy_token_since_we_focus_on_register";
        const response = await api.post("/auth/login/", {
          email,
          password,
          recaptcha_token,
        });

        // Almacenamiento seguro del Token de Acceso
        const { access } = response.data;
        localStorage.setItem("access_token", access);
        if (response.data.refresh) {
          localStorage.setItem("refresh_token", response.data.refresh);
        }

        setSuccess("Sesión iniciada correctamente.");
        // Cierra el modal y refresca la pantalla tras un breve delay para actualizar la UI del Navbar
        setTimeout(() => {
          closeModal();
          window.location.reload();
        }, 1000);
      } catch (err) {
        setError(formatError(err));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={closeModal}
        initialFocus={emailRef}
      >
        {/* ------------------------------------------------------------- */}
        {/* --------- COMPONENTES VISUALES: ESTRUCTURA DE FONDO -------- */}
        {/* ------------------------------------------------------------- */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* Fondo traslúcido oscuro con desenfoque de fondo ("backdrop-blur") */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-6 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-6 scale-95"
            >
              {/* ------------------------------------------------------------- */}
              {/* --------- COMPONENTES VISUALES: PANEL PRINCIPAL ------------ */}
              {/* ------------------------------------------------------------- */}
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-gradient-to-b from-white/100 via-white/95 to-white/95 p-6 text-left align-middle shadow-2xl transition-all backdrop-blur-sm relative">

                {/* --------- COMPONENTE: BOTÓN CERRAR (✕) --------- */}
                <button
                  onClick={closeModal}
                  aria-label="Cerrar"
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 font-bold"
                >
                  ✕
                </button>

                {/* --------- COMPONENTE: TÍTULO Y SUBTÍTULO --------- */}
                <div className="text-center mb-4">
                  <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-fuchsia-500">
                    {mode === "login" ? "Bienvenido" : "Crear Cuenta"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {mode === "login"
                      ? "Inicia sesión para continuar"
                      : "Únete a nuestra comunidad de bailarines"}
                  </p>
                </div>

                {/* --------- COMPONENTE: BANNER DE ERROR --------- */}
                {error && (
                  <div className="p-3 mb-4 text-xs font-semibold text-red-700 bg-red-50 rounded-xl whitespace-pre-line border border-red-100 animate-pulse">
                    ⚠️ {error}
                  </div>
                )}

                {/* --------- COMPONENTE: BANNER DE ÉXITO --------- */}
                {success && (
                  <div className="p-3 mb-4 text-xs font-semibold text-green-700 bg-green-50 rounded-xl border border-green-100">
                    ✅ {success}
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* --------- COMPONENTES VISUALES: FORMULARIO DINÁMICO -------- */}
                {/* ------------------------------------------------------------- */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "register" ? (
                    <>
                      {/* --------- COMPONENTE OCULTO: ROL ACTUAL --------- */}
                      <input type="hidden" name="role" value={selectedRole} />

                      {/* --------- CAMPO: NOMBRE Y APELLIDO (GRID 2 COLUMNAS) --------- */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Campo: Nombre */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                            Nombre
                          </label>
                          <input
                            name="first_name"
                            type="text"
                            placeholder="Juan"
                            required
                            className="w-full rounded-xl px-4 py-2.5 bg-white/70 border border-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                          />
                        </div>
                        {/* Campo: Apellido */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                            Apellido
                          </label>
                          <input
                            name="last_name"
                            type="text"
                            placeholder="Solarte"
                            required
                            className="w-full rounded-xl px-4 py-2.5 bg-white/70 border border-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      {/* --------- CAMPO: CORREO ELECTRÓNICO (REGISTRO) --------- */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                          Correo Electrónico
                        </label>
                        <input
                          ref={emailRef}
                          name="email"
                          type="email"
                          placeholder="tu@email.com"
                          required
                          className="w-full rounded-xl px-4 py-2.5 bg-white/70 border border-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                        />
                      </div>

                      {/* --------- CAMPO: TELÉFONO Y SELECCIÓN DE ROL (GRID 2 COLUMNAS) --------- */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Campo: Teléfono (Opcional) */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                            Teléfono <span className="text-gray-400 text-[10px] font-normal lowercase">(Opcional)</span>
                          </label>
                          <input
                            name="phone"
                            type="tel"
                            placeholder="3123456789"
                            className="w-full rounded-xl px-4 py-2.5 bg-white/70 border border-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                          />
                        </div>

                        {/* Campo: Rol (Segmented Control Premium - Cliente vs Profesor) */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                            Quiero ser
                          </label>
                          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl h-[42px] items-center border border-gray-200/50">
                            {/* Sub-botón: Cliente */}
                            <button
                              type="button"
                              onClick={() => setSelectedRole("cliente")}
                              className={`h-full text-xs font-bold rounded-lg transition-all duration-300 ${selectedRole === "cliente"
                                  ? "bg-white text-purple-600 shadow-sm border border-purple-100/50"
                                  : "text-gray-500 hover:text-gray-800"
                                }`}
                            >
                              Cliente
                            </button>
                            {/* Sub-botón: Profesor */}
                            <button
                              type="button"
                              onClick={() => setSelectedRole("profesor")}
                              className={`h-full text-xs font-bold rounded-lg transition-all duration-300 ${selectedRole === "profesor"
                                  ? "bg-white text-purple-600 shadow-sm border border-purple-100/50"
                                  : "text-gray-500 hover:text-gray-800"
                                }`}
                            >
                              Profesor
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* --------- CAMPO: CONTRASEÑA (REGISTRO) --------- */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                          Contraseña
                        </label>
                        <input
                          name="password"
                          type="password"
                          placeholder="********"
                          required
                          className="w-full rounded-xl px-4 py-2.5 bg-white/70 border border-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* --------- CAMPO: CORREO ELECTRÓNICO (LOGIN) --------- */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                          Correo Electrónico
                        </label>
                        <input
                          ref={emailRef}
                          name="email"
                          type="email"
                          placeholder="tu@email.com"
                          required
                          className="w-full rounded-xl px-4 py-3 bg-white/70 border border-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                        />
                      </div>

                      {/* --------- CAMPO: CONTRASEÑA (LOGIN) --------- */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                          Contraseña
                        </label>
                        <input
                          name="password"
                          type="password"
                          placeholder="********"
                          required
                          className="w-full rounded-xl px-4 py-3 bg-white/70 border border-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                        />
                      </div>

                      {/* --------- CAMPO: RECORDARME Y RECUPERACIÓN (LOGIN) --------- */}
                      <div className="flex items-center justify-between select-none">
                        {/* Recordarme Checkbox */}
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            name="remember"
                            className="w-4 h-4 rounded text-purple-600 border-gray-300 focus:ring-purple-400 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700">Recordarme</span>
                        </label>
                        {/* Enlace de recuperación */}
                        <a
                          href="#"
                          className="text-sm text-fuchsia-500 hover:underline"
                        >
                          ¿Olvidaste tu contraseña?
                        </a>
                      </div>
                    </>
                  )}

                  {/* --------- COMPONENTE: BOTÓN SUBMIT PRINCIPAL (ACCEDER / REGISTRARSE) --------- */}
                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full py-3 rounded-2xl text-white font-bold bg-gradient-to-r from-purple-500 to-fuchsia-500 shadow-md transition-all transform active:scale-[0.98] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400/50 flex items-center justify-center gap-2 ${loading ? "opacity-75 cursor-not-allowed" : ""
                        }`}
                    >
                      {/* Spinner animado que reemplaza el texto si se está cargando */}
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : mode === "login" ? (
                        "Acceder"
                      ) : (
                        "Registrarse"
                      )}
                    </button>
                  </div>
                </form>

                {/* ------------------------------------------------------------- */}
                {/* --------- COMPONENTES VISUALES: ALTERNATIVA SOCIAL --------- */}
                {/* ------------------------------------------------------------- */}
                <div className="my-4 flex items-center">
                  <div className="flex-1 h-px bg-gray-200" />
                  <div className="px-3 text-xs text-gray-400 font-bold uppercase tracking-wider">
                    O continúa con
                  </div>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Botón: Google */}
                  <button className="flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm">
                    <span className="text-lg font-bold text-gray-700">G</span>
                    <span className="text-sm text-gray-600 font-medium">Google</span>
                  </button>
                  {/* Botón: Facebook */}
                  <button className="flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm">
                    <span className="text-lg font-bold text-gray-700">f</span>
                    <span className="text-sm text-gray-600 font-medium">Facebook</span>
                  </button>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* --------- COMPONENTES VISUALES: CONMUTADOR DE MODOS --------- */}
                {/* ------------------------------------------------------------- */}
                <div className="mt-4 text-center text-sm text-gray-600 select-none">
                  {mode === "login" ? (
                    <>
                      ¿No tienes cuenta?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("register")}
                        className="text-fuchsia-500 font-bold hover:underline transition-all"
                      >
                        Regístrate
                      </button>
                    </>
                  ) : (
                    <>
                      ¿Ya tienes cuenta?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="text-fuchsia-500 font-bold hover:underline transition-all"
                      >
                        Inicia sesión
                      </button>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default AuthModal;


