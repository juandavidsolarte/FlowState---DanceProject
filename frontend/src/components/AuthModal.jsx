// ─── Imports ─────────────────────────────────────────────────────────────────
// useState   → maneja los estados locales del formulario (errores, captcha, etc.)
// useRef     → referencia al input de email para que el modal lo enfoque al abrirse
// Fragment   → contenedor invisible que Headless UI necesita para las animaciones
import React, { Fragment, useRef, useState } from "react";

// Dialog y Transition son componentes de Headless UI.
// Dialog   → crea el modal accesible (manejo de foco, tecla Escape, etc.)
// Transition → anima la entrada y salida del modal con clases de Tailwind
import { Dialog, Transition } from "@headlessui/react";

// Link      → enlace de React Router (no recarga la página, navega internamente)
// useNavigate → hook para redirigir al usuario por código (ej. tras login exitoso)
import { Link, useNavigate } from "react-router-dom";

// CaptchaField → componente que renderiza el widget de Google reCAPTCHA v2.
//                Recibe la siteKey y llama a onChange cuando el usuario lo resuelve.
import CaptchaField from "./auth/CaptchaField";
import { useAuth } from "../context/AuthContext";

// getRecaptchaSiteKey → lee VITE_RECAPTCHA_SITE_KEY del .env.
//                       Si no existe, en desarrollo usa la test key de Google
//                       (6LeIxAcT...) que siempre aprueba sin marcar el checkbox.
import { getRecaptchaSiteKey } from "../config/recaptcha";

// ─── Constante de configuración ───────────────────────────────────────────────
// Se llama fuera del componente para que no se recalcule en cada render.
// En producción será la key real de tu proyecto en Google reCAPTCHA Admin.
const recaptchaSiteKey = getRecaptchaSiteKey();

// ─── Componente principal ────────────────────────────────────────────────────
// Recibe dos props desde App.jsx:
//   isOpen     → booleano que controla si el modal se muestra o no
//   closeModal → función de App.jsx que pone isOpen=false
const AuthModal = ({ isOpen, closeModal }) => {

  // ── Ref de foco ──────────────────────────────────────────────────────────
  // emailRef se pasa a initialFocus del Dialog para que, al abrir el modal,
  // el cursor quede automáticamente dentro del campo de correo (buena UX).
  const emailRef = useRef(null);

  // ── Navegación programática ───────────────────────────────────────────────
  // useNavigate devuelve una función que cambia la URL sin recargar la página.
  // La usamos después del login para llevar al usuario a su pantalla correcta.
  const navigate = useNavigate();
  const { login } = useAuth();

  // ── Estados del formulario ────────────────────────────────────────────────
  // captchaToken  → string con el token que Google entrega cuando el usuario
  //                 resuelve el CAPTCHA. Vacío = CAPTCHA no completado.
  const [captchaToken, setCaptchaToken] = useState("");

  // captchaStatus → mensaje informativo debajo del CAPTCHA ("Verificación completada",
  //                 "Error al cargar CAPTCHA", etc.)
  const [captchaStatus, setCaptchaStatus] = useState("");

  // submitting    → true mientras la petición al backend está en vuelo.
  //                 Sirve para deshabilitar el botón y evitar doble envío.
  const [submitting, setSubmitting] = useState(false);

  // errors        → objeto con mensajes de error por campo:
  //                 { form: "...", captcha: "..." }
  //                 errors.form  → error general del servidor (credenciales malas, etc.)
  //                 errors.captcha → error del widget CAPTCHA
  const [errors, setErrors] = useState({});

  // ── handleClose ───────────────────────────────────────────────────────────
  // Versión "limpia" de closeModal.
  // Antes de cerrar el modal resetea todos los estados locales para que,
  // si el usuario lo vuelve a abrir, no vea errores ni tokens viejos.
  const handleClose = () => {
    setErrors({});         // borra cualquier mensaje de error visible
    setCaptchaToken("");   // descarta el token del CAPTCHA anterior
    setCaptchaStatus("");  // borra el texto de estado del CAPTCHA
    closeModal();          // llama a la función de App.jsx que pone isOpen=false
  };

  // ── handleSubmit ──────────────────────────────────────────────────────────
  // Función asíncrona que se ejecuta cuando el usuario presiona "Acceder".
  // Contiene toda la lógica de login: validación, llamada al API, redirección.
  const handleSubmit = async (e) => {
    e.preventDefault(); // evita que el <form> recargue la página (comportamiento HTML por defecto)
    setErrors({});       // limpia errores de un intento anterior antes de reintentar

    // FormData lee los values de los inputs del formulario por su atributo name="".
    // Es una API nativa del navegador, no necesita librerías.
    const formData = new FormData(e.target);
    const email = formData.get("email");    // input con name="email"
    const password = formData.get("password"); // input con name="password"

    // ── Guardia de CAPTCHA ────────────────────────────────────────────────
    // Si hay una siteKey configurada (CAPTCHA activo) pero el usuario
    // no lo ha completado todavía, mostramos el error y cortamos la ejecución.
    // El backend también lo rechazaría, pero esta validación da feedback inmediato.
    if (recaptchaSiteKey && !captchaToken) {
      setErrors({ captcha: "Completa el CAPTCHA para continuar." });
      return; // salimos sin hacer la petición al servidor
    }

      // ── Petición al backend ───────────────────────────────────────────────
    setSubmitting(true); // bloquea el botón mientras esperamos respuesta
    try {
        const { user } = await login(email, password, captchaToken || "test-token");

      handleClose(); // cierra el modal y limpia estados antes de navegar

      // ── Redirección según rol ─────────────────────────────────────────
        const adminRoles = ["director", "admin"];
        if (adminRoles.includes(user.role)) {
          navigate("/dashboard/admin");
        } else if (user.role === "profesor") {
          navigate("/dashboard/profesor");
        } else {
          navigate("/cliente/mi-perfil");
        }

    } catch (err) {
      // ── Manejo de errores del servidor ────────────────────────────────
      // El backend puede responder con distintos formatos de error:
      //
      // 1. { detail: "Credenciales incorrectas..." }
      //    → Un solo mensaje general. Lo mostramos en el banner rojo (errors.form).
      //
      // 2. { email: ["Este campo es requerido."], password: [...] }
      //    → Errores por campo. Los mapeamos al objeto errors para mostrar
      //      cada uno junto a su input correspondiente.
      //
      // 3. Error de red / sin respuesta del servidor
      //    → Mensaje genérico de fallback.

      const detail = err.response?.data?.detail;  // formato 1
      const fieldErrors = err.response?.data;           // formato 2

      if (detail) {
        // Caso 1: mensaje general (ej. "Cuenta no verificada.")
        setErrors({ form: detail });
      } else if (fieldErrors && typeof fieldErrors === "object") {
        // Caso 2: errores por campo → los aplanamos en un objeto simple
        const mapped = {};
        Object.entries(fieldErrors).forEach(([key, val]) => {
          // DRF devuelve arrays de strings por campo, tomamos solo el primero
          mapped[key] = Array.isArray(val) ? val[0] : val;
        });
        const fallbackMessage =
          mapped.form ||
          mapped.error ||
          mapped.non_field_errors ||
          Object.values(mapped).find(Boolean);
        setErrors({
          ...mapped,
          form: fallbackMessage || "No pudimos iniciar sesión. Intenta nuevamente.",
        });
      } else {
        // Caso 3: error de red o desconocido
        setErrors({ form: "No pudimos iniciar sesión. Intenta nuevamente." });
      }
    } finally {
      // finally siempre se ejecuta, sin importar si hubo éxito o error.
      // Reactivamos el botón para que el usuario pueda volver a intentarlo.
      setSubmitting(false);
    }
  };

  // ─── JSX del modal ────────────────────────────────────────────────────────
  return (
    // Transition.Root controla si el árbol entero del modal se monta/desmonta.
    // La prop show={isOpen} es la que abre o cierra todo.
    <Transition.Root show={isOpen} as={Fragment}>

      {/* Dialog es el modal accesible: maneja foco, Escape, aria-modal, etc.
          onClose={handleClose} → se llama si el usuario presiona Escape o hace
          clic en el fondo oscuro fuera del panel */}
      <Dialog
        as="div"
        className="relative z-50"
        onClose={handleClose}
        initialFocus={emailRef}  // el foco va directo al input de email al abrir
      >

        {/* ── Fondo oscurecido (backdrop) ────────────────────────────────
            Transition.Child anima solo este div.
            Aparece con fade-in (opacity-0 → opacity-100) y desaparece con fade-out. */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">

            {/* ── Panel del modal (tarjeta blanca/oscura) ──────────────────
                Transition.Child anima solo esta tarjeta.
                Entra desde abajo y pequeño (translate-y-6 scale-95) hasta su
                posición normal (translate-y-0 scale-100). */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-6 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-6 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-card via-card to-background p-6 text-left align-middle shadow-2xl transition-all backdrop-blur-xl">

                {/* ── Botón X (cerrar) ──────────────────────────────────────
                    Usa handleClose (no closeModal directo) para limpiar
                    estados antes de cerrar. */}
                <button
                  onClick={handleClose}
                  aria-label="Cerrar"
                  className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
                >
                  ✕
                </button>

                {/* ── Encabezado ────────────────────────────────────────────*/}
                <div className="text-center mb-4">
                  <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 dark:from-fuchsia-300 dark:to-purple-300">
                    Bienvenido
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Inicia sesión para continuar
                  </p>
                </div>

                {/* ── Banner de error global ────────────────────────────────
                    Solo se renderiza si errors.form tiene contenido.
                    Muestra mensajes del servidor: "Credenciales incorrectas",
                    "Cuenta no verificada. Revisa tu correo.", etc. */}
                {errors.form && (
                  <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {errors.form}
                  </div>
                )}

                {/* ── Formulario de login ───────────────────────────────────
                    onSubmit={handleSubmit} → previene el submit nativo y
                    ejecuta nuestra función asíncrona. */}
                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Campo email */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Correo Electrónico
                    </label>
                    <input
                      ref={emailRef}   // para el foco automático al abrir el modal
                      name="email"     // FormData lo lee por este name
                      type="email"
                      placeholder="tu@email.com"
                      required
                      className="w-full rounded-xl border border-input bg-background/80 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                    />
                  </div>

                  {/* Campo contraseña */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Contraseña
                    </label>
                    <input
                      name="password"  // FormData lo lee por este name
                      type="password"
                      placeholder="********"
                      required
                      className="w-full rounded-xl border border-input bg-background/80 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                    />
                  </div>

                  {/* Recordarme + ¿Olvidaste tu contraseña? */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="remember"
                        className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                      />
                      <span className="text-sm text-foreground">Recordarme</span>
                    </label>
                    <a
                      href="#"
                      className="text-sm text-fuchsia-500 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>

                  {/* ── Widget reCAPTCHA ──────────────────────────────────────
                      CaptchaField renderiza el checkbox de Google "No soy un robot".
                      Props que recibe:
                        siteKey       → clave pública de Google (del .env o test key)
                        onChange      → Google llama esta función con el token cuando
                                        el usuario supera el desafío. Si expira, lo llama
                                        con null (el componente ya lo maneja con onExpired)
                        onErrored     → se dispara si el widget falla al cargar
                                        (ej. mala siteKey, dominio no autorizado)
                        error         → mensaje a mostrar debajo del CAPTCHA
                        statusMessage → texto informativo encima del widget */}
                  <CaptchaField
                    siteKey={recaptchaSiteKey}
                    onChange={(token) => {
                      setCaptchaToken(token || "");  // guarda el token o vacía si expiró
                      setCaptchaStatus(token ? "Verificación completada" : "");
                      // Si el usuario resolvió el CAPTCHA, borramos el error de captcha
                      if (token) setErrors((prev) => ({ ...prev, captcha: undefined }));
                    }}
                    onErrored={() => {
                      // El widget no cargó → limpiamos el token y mostramos error
                      setCaptchaToken("");
                      setCaptchaStatus("Error al cargar CAPTCHA");
                      setErrors((prev) => ({
                        ...prev,
                        captcha: "No pudimos cargar el CAPTCHA. Verifica la clave de sitio.",
                      }));
                    }}
                    error={errors.captcha}       // error de validación del CAPTCHA
                    statusMessage={captchaStatus} // texto de estado encima del widget
                  />

                  {/* ── Botón "Acceder" ───────────────────────────────────────
                      disabled={submitting} → se deshabilita mientras la petición
                      está en vuelo, evitando que el usuario haga clic varias veces.
                      El texto cambia a "Accediendo..." como feedback visual. */}
                  <div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 py-3 font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Accediendo..." : "Acceder"}
                    </button>
                  </div>
                </form>

                {/* ── Separador "O CONTINÚA CON" ────────────────────────────*/}
                <div className="my-4 flex items-center">
                  <div className="h-px flex-1 bg-border" />
                  <div className="px-3 text-xs text-muted-foreground">
                    O CONTINÚA CON
                  </div>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Botones de login social (Google / Facebook) — pendiente de implementar */}
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background py-2 text-foreground transition-colors hover:bg-muted">
                    <span className="text-lg font-bold">G</span>
                    <span className="text-sm">Google</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background py-2 text-foreground transition-colors hover:bg-muted">
                    <span className="text-lg font-bold">f</span>
                    <span className="text-sm">Facebook</span>
                  </button>
                </div>

                {/* ── Link a registro ───────────────────────────────────────
                    onClick={handleClose} → cierra y limpia el modal antes de
                    navegar a /registro para no dejar estados sucios. */}
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  ¿No tienes cuenta?{" "}
                  <Link
                    to="/registro"
                    onClick={handleClose}
                    className="font-semibold text-fuchsia-500"
                  >
                    Regístrate
                  </Link>
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
