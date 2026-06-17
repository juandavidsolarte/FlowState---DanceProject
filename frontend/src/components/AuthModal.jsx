import React, { Fragment, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Link } from "react-router-dom";

const AuthModal = ({ isOpen, closeModal }) => {
  const emailRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" aria-hidden="true" />
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
              <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-card via-card to-background p-6 text-left align-middle shadow-2xl transition-all backdrop-blur-xl">
                {/* Close X */}
                <button
                  onClick={closeModal}
                  aria-label="Cerrar"
                  className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
                >
                  ✕
                </button>

                <div className="text-center mb-4">
                  <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 dark:from-fuchsia-300 dark:to-purple-300">
                    Bienvenido
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Inicia sesión para continuar
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Correo Electrónico
                    </label>
                    <input
                      ref={emailRef}
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                      className="w-full rounded-xl border border-input bg-background/80 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Contraseña
                    </label>
                    <input
                      name="password"
                      type="password"
                      placeholder="********"
                      required
                      className="w-full rounded-xl border border-input bg-background/80 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                    />
                  </div>

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

                  <div>
                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 py-3 font-bold text-white shadow-md"
                    >
                      Acceder
                    </button>
                  </div>
                </form>

                <div className="my-4 flex items-center">
                  <div className="h-px flex-1 bg-border" />
                  <div className="px-3 text-xs text-muted-foreground">
                    O CONTINÚA CON
                  </div>
                  <div className="h-px flex-1 bg-border" />
                </div>

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

                <div className="mt-4 text-center text-sm text-muted-foreground">
                  ¿No tienes cuenta?{" "}
                  <Link
                    to="/registro"
                    onClick={closeModal}
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
