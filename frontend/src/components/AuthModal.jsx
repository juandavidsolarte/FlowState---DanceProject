import React, { Fragment, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";

const AuthModal = ({ isOpen, closeModal }) => {
  const emailRef = useRef(null);
  const [mode, setMode] = useState("login"); // 'login' or 'register'

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = {
      mode,
      email: form.get("email"),
      password: form.get("password"),
      remember: form.get("remember") === "on",
    };
    console.log("Auth submit", data);
    // TODO: connect to API depending on mode
    closeModal();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={closeModal}
        initialFocus={emailRef}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-gradient-to-b from-white/100 via-white/95 to-white/95 p-6 text-left align-middle shadow-2xl transition-all backdrop-blur-sm relative">
                {/* Close X */}
                <button
                  onClick={closeModal}
                  aria-label="Cerrar"
                  className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                >
                  ✕
                </button>

                <div className="text-center mb-4">
                  <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500">
                    {mode === "login" ? "Bienvenido" : "Crear Cuenta"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {mode === "login"
                      ? "Inicia sesión para continuar"
                      : "Únete a nuestra comunidad de bailarines"}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Correo Electrónico
                    </label>
                    <input
                      ref={emailRef}
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                      className="w-full rounded-xl px-4 py-3 bg-white/60 border border-gray-200 placeholder-gray-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Contraseña
                    </label>
                    <input
                      name="password"
                      type="password"
                      placeholder="********"
                      required
                      className="w-full rounded-xl px-4 py-3 bg-white/60 border border-gray-200 placeholder-gray-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="remember"
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">Recordarme</span>
                    </label>
                    <a
                      href="#"
                      className="text-sm text-fuchsia-500 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="w-full py-3 rounded-2xl text-white font-bold bg-gradient-to-r from-purple-500 to-fuchsia-500 shadow-md"
                    >
                      Acceder
                    </button>
                  </div>
                </form>

                <div className="my-4 flex items-center">
                  <div className="flex-1 h-px bg-gray-200" />
                  <div className="px-3 text-xs text-gray-500">
                    O CONTINÚA CON
                  </div>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 bg-white">
                    <span className="text-lg font-bold">G</span>
                    <span className="text-sm">Google</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 bg-white">
                    <span className="text-lg font-bold">f</span>
                    <span className="text-sm">Facebook</span>
                  </button>
                </div>

                <div className="mt-4 text-center text-sm text-gray-600">
                  {mode === "login" ? (
                    <>
                      ¿No tienes cuenta?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("register")}
                        className="text-fuchsia-500 font-semibold"
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
                        className="text-fuchsia-500 font-semibold"
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
