import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import CaptchaField from "../components/auth/CaptchaField";
import { getRecaptchaSiteKey } from "../config/recaptcha";
import { useAuth } from "../context/AuthContext";
import { notifyAuthChanged } from "../context/CartContext";

const recaptchaSiteKey = getRecaptchaSiteKey();

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const verify = async () => {
      try {
        const response = await api.get(`/auth/verify-email/${token}/`, { withCredentials: true });
        const { access, user } = response.data;
        setSession(access, user);
        notifyAuthChanged();
        if (active) {
          setStatus("success");
          setMessage(response.data.message || "Cuenta verificada correctamente.");
          navigate("/catalogo", { replace: true });
        }
      } catch (error) {
        if (!active) return;
        const detail = error.response?.data?.detail;
        setMessage(detail || "Verification link is invalid.");
        setStatus(detail === "Verification link has expired." ? "expired" : "invalid");
      }
    };

    verify();

    return () => {
      active = false;
    };
  }, [navigate, setSession, token]);

  const resend = async (event) => {
    event.preventDefault();
    if (!captchaToken) {
      setMessage("Completa el CAPTCHA para reenviar el correo.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/auth/resend-verification/", {
        email,
        recaptcha_token: captchaToken,
      });
      setMessage(response.data.message || "Si la cuenta existe, se enviará un nuevo enlace de verificación.");
    } catch (error) {
      setMessage(error.response?.data?.detail || "No se pudo reenviar el correo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground md:px-8">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-border bg-card p-8 shadow-xl md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-fuchsia-500">Verificación de correo</p>
        <h1 className="mt-3 text-3xl font-black md:text-4xl">
          {status === "loading" ? "Verificando tu cuenta..." : message}
        </h1>

        {status === "loading" ? (
          <p className="mt-4 text-muted-foreground">No cierres esta ventana mientras procesamos la verificación.</p>
        ) : null}

        {(status === "invalid" || status === "expired") ? (
          <div className="mt-8 grid gap-4">
            <p className="text-muted-foreground">
              {status === "expired"
                ? "Verifica tu correo para solicitar un nuevo enlace."
                : "Si el enlace es incorrecto, puedes solicitar uno nuevo."}
            </p>
            <form onSubmit={resend} className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Correo electrónico</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                  placeholder="tu@email.com"
                />
              </label>

              <CaptchaField
                siteKey={recaptchaSiteKey}
                onChange={(value) => setCaptchaToken(value || "")}
                onErrored={() => setCaptchaToken("")}
                error={""}
              />

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-6 py-3 font-bold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Enviando..." : "Reenviar verificación"}
              </button>
            </form>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="rounded-full border border-border px-5 py-2.5 font-medium transition-colors hover:bg-muted">
            Ir al inicio
          </Link>
          <Link to="/catalogo" className="rounded-full border border-border px-5 py-2.5 font-medium transition-colors hover:bg-muted">
            Ver catálogo
          </Link>
        </div>
      </div>
    </main>
  );
}
