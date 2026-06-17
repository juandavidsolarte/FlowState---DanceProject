import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Globe2, Mail, User2, CalendarDays, ShieldCheck } from "lucide-react";
import api from "../services/api";
import AuthCard from "../components/auth/AuthCard";
import FormField from "../components/auth/FormField";
import TextInput from "../components/auth/TextInput";
import PasswordInput from "../components/auth/PasswordInput";
import CheckboxField from "../components/auth/CheckboxField";
import CaptchaField from "../components/auth/CaptchaField";
import { getRecaptchaSiteKey } from "../config/recaptcha";

const initialForm = {
  full_name: "",
  email: "",
  confirm_email: "",
  password: "",
  confirm_password: "",
  date_of_birth: "",
  country: "",
  accepted: false,
};

const recaptchaSiteKey = getRecaptchaSiteKey();

const countries = [
  "Colombia",
  "México",
  "Argentina",
  "Chile",
  "Perú",
  "España",
  "Estados Unidos",
  "Otro",
];

const passwordStrength = (value) => {
  if (!value) return "";
  if (value.length < 8) return "Usa al menos 8 caracteres.";
  if (!/[A-Z]/.test(value)) return "Incluye al menos una mayúscula.";
  if (!/[a-z]/.test(value)) return "Incluye al menos una minúscula.";
  if (!/\d/.test(value)) return "Incluye al menos un número.";
  return "";
};

const splitFullName = (fullName) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
};

const getAge = (birthDate) => {
  const today = new Date();
  const dob = new Date(birthDate);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3.5 text-white placeholder:text-white/35 shadow-sm outline-none transition duration-200 focus:border-fuchsia-300/70 focus:bg-white/10 focus:ring-2 focus:ring-fuchsia-400/30";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaStatus, setCaptchaStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendSubmitting, setResendSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState("");

  const passwordError = useMemo(() => passwordStrength(form.password), [form.password]);

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.full_name.trim()) nextErrors.full_name = "Ingresa tu nombre completo.";
    else if (!splitFullName(form.full_name)) nextErrors.full_name = "Incluye nombre y apellido.";

    if (!form.email.trim()) nextErrors.email = "El correo electrónico es obligatorio.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Ingresa un correo válido.";
    }

    if (!form.confirm_email.trim()) nextErrors.confirm_email = "Confirma tu correo electrónico.";
    if (form.email && form.confirm_email && form.email !== form.confirm_email) {
      nextErrors.confirm_email = "Los correos electrónicos no coinciden.";
    }

    if (!form.password) nextErrors.password = "La contraseña es obligatoria.";
    if (passwordError) nextErrors.password = passwordError;

    if (!form.confirm_password) nextErrors.confirm_password = "Confirma tu contraseña.";
    if (form.password && form.confirm_password && form.password !== form.confirm_password) {
      nextErrors.confirm_password = "Las contraseñas no coinciden.";
    }

    if (!form.date_of_birth) {
      nextErrors.date_of_birth = "La fecha de nacimiento es obligatoria.";
    } else if (getAge(form.date_of_birth) < 18) {
      nextErrors.date_of_birth = "Debes tener al menos 18 años para registrarte.";
    }

    if (!form.accepted) nextErrors.accepted = "Debes confirmar que eres mayor de edad y aceptar los términos.";
    if (!recaptchaSiteKey) nextErrors.captcha = "Configura VITE_RECAPTCHA_SITE_KEY para habilitar el CAPTCHA.";
    if (recaptchaSiteKey && !captchaToken) nextErrors.captcha = "Completa el CAPTCHA para continuar.";

    return nextErrors;
  };

  const submitRegistration = async (event) => {
    event.preventDefault();
    setServerMessage("");

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const names = splitFullName(form.full_name);
    if (!names) {
      setErrors((current) => ({ ...current, full_name: "Incluye nombre y apellido." }));
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/register/", {
        first_name: names.first_name,
        last_name: names.last_name,
        email: form.email,
        password: form.password,
        confirm_password: form.confirm_password,
        date_of_birth: form.date_of_birth,
        country: form.country,
        age_confirmation: true,
        terms_accepted: true,
        recaptcha_token: captchaToken,
      });
      setIsSuccess(true);
      setServerMessage("Te enviamos un correo de verificación. Revisa tu bandeja de entrada para activar tu cuenta.");
      setCaptchaToken("");
    } catch (error) {
      const detail = error.response?.data?.detail;
      const fieldErrors = error.response?.data;
      const nextErrors = {};

      if (detail) {
        nextErrors.form = detail;
      } else if (fieldErrors && typeof fieldErrors === "object") {
        Object.entries(fieldErrors).forEach(([key, value]) => {
          nextErrors[key] = Array.isArray(value) ? value[0] : value;
        });
      } else {
        nextErrors.form = "No pudimos completar el registro. Intenta nuevamente.";
      }

      setErrors(nextErrors);
    } finally {
      setSubmitting(false);
    }
  };

  const resendVerification = async (event) => {
    event.preventDefault();

    if (!recaptchaSiteKey) {
      setErrors((current) => ({
        ...current,
        resendCaptcha: "Configura VITE_RECAPTCHA_SITE_KEY para reenviar el correo.",
      }));
      return;
    }

    if (!captchaToken) {
      setErrors((current) => ({
        ...current,
        resendCaptcha: "Completa el CAPTCHA para reenviar el correo.",
      }));
      return;
    }

    setResendSubmitting(true);
    try {
      const response = await api.post("/auth/resend-verification/", {
        email: form.email,
        recaptcha_token: captchaToken,
      });
      setServerMessage(response.data.message || "Revisa tu correo para verificar tu cuenta.");
    } catch (error) {
      setErrors((current) => ({
        ...current,
        resendCaptcha: error.response?.data?.detail || "No pudimos reenviar el correo.",
      }));
    } finally {
      setResendSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#12071f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.35),_transparent_34%),radial-gradient(circle_at_20%_20%,_rgba(236,72,153,0.22),_transparent_28%),linear-gradient(180deg,#1b0a2a_0%,#12071f_52%,#090412_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-100/80 backdrop-blur-md">
            Registro seguro
          </div>
          <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Empieza a aprender y comprar las mejores coreografías
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/70 sm:text-lg">
            Crea tu cuenta y accede a nuestro catálogo exclusivo de coreografías profesionales.
          </p>
        </div>

        <div className="mx-auto w-full max-w-[680px]">
          <AuthCard>
            {!isSuccess ? (
              <form onSubmit={submitRegistration} noValidate className="grid gap-5">
                {errors.form ? (
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {errors.form}
                  </div>
                ) : null}

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField id="full_name" label="Nombre completo" error={errors.full_name} required>
                    <TextInput
                      id="full_name"
                      name="full_name"
                      value={form.full_name}
                      onChange={onChange}
                      placeholder="Ana García"
                      icon={User2}
                      aria-invalid={Boolean(errors.full_name)}
                      aria-describedby={errors.full_name ? "full_name-error" : undefined}
                    />
                  </FormField>

                  <FormField id="country" label="País" error={errors.country}>
                    <div className="relative">
                      <Globe2 className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/45" />
                      <select
                        id="country"
                        name="country"
                        value={form.country}
                        onChange={onChange}
                        className={`${inputClass} pl-11`}
                      >
                        <option value="">Selecciona tu país</option>
                        {countries.map((country) => (
                          <option key={country} value={country} className="text-slate-900">
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>
                  </FormField>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField id="email" label="Correo electrónico" error={errors.email} required>
                    <TextInput
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={onChange}
                      placeholder="tu@email.com"
                      icon={Mail}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "email-error" : undefined}
                    />
                  </FormField>

                  <FormField id="confirm_email" label="Confirmar correo electrónico" error={errors.confirm_email} required>
                    <TextInput
                      id="confirm_email"
                      name="confirm_email"
                      type="email"
                      value={form.confirm_email}
                      onChange={onChange}
                      placeholder="Repite tu correo"
                      icon={Mail}
                      aria-invalid={Boolean(errors.confirm_email)}
                      aria-describedby={errors.confirm_email ? "confirm_email-error" : undefined}
                    />
                  </FormField>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField id="password" label="Contraseña" error={errors.password} required helperText="Al menos 8 caracteres, una mayúscula y un número.">
                    <PasswordInput
                      id="password"
                      name="password"
                      value={form.password}
                      onChange={onChange}
                      placeholder="Crea una contraseña segura"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? "password-error" : undefined}
                    />
                  </FormField>

                  <FormField id="confirm_password" label="Confirmar contraseña" error={errors.confirm_password} required>
                    <PasswordInput
                      id="confirm_password"
                      name="confirm_password"
                      value={form.confirm_password}
                      onChange={onChange}
                      placeholder="Repite tu contraseña"
                      aria-invalid={Boolean(errors.confirm_password)}
                      aria-describedby={errors.confirm_password ? "confirm_password-error" : undefined}
                    />
                  </FormField>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField id="date_of_birth" label="Fecha de nacimiento" error={errors.date_of_birth} required>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/45" />
                      <input
                        id="date_of_birth"
                        name="date_of_birth"
                        type="date"
                        value={form.date_of_birth}
                        onChange={onChange}
                        className={`${inputClass} pl-11 [color-scheme:dark]`}
                        aria-invalid={Boolean(errors.date_of_birth)}
                        aria-describedby={errors.date_of_birth ? "date_of_birth-error" : undefined}
                      />
                    </div>
                  </FormField>

                  <div className="flex items-end">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
                      <p className="flex items-center gap-2 font-semibold text-white">
                        <ShieldCheck className="h-4.5 w-4.5 text-fuchsia-300" />
                        Tu cuenta se verifica por correo
                      </p>
                      <p className="mt-2 leading-6">
                        Verificamos tu edad, protegemos el registro con CAPTCHA y activamos tu acceso tras confirmar el email.
                      </p>
                    </div>
                  </div>
                </div>

                <CheckboxField
                  id="accepted"
                  checked={form.accepted}
                  onChange={onChange}
                  label="Confirmo que soy mayor de edad y acepto los términos y condiciones."
                  error={errors.accepted}
                />

                <CaptchaField
                  siteKey={recaptchaSiteKey}
                  onChange={(token) => {
                    setCaptchaToken(token || "");
                    setCaptchaStatus(token ? "Verificación completada" : "");
                    if (token) {
                      setErrors((current) => ({
                        ...current,
                        captcha: undefined,
                        resendCaptcha: undefined,
                      }));
                    }
                  }}
                  onErrored={() => {
                    setCaptchaToken("");
                    setCaptchaStatus("Error al cargar CAPTCHA");
                    setErrors((current) => ({
                      ...current,
                      captcha: "No pudimos cargar el CAPTCHA. Verifica la clave de sitio o el dominio autorizado.",
                    }));
                  }}
                  error={errors.captcha}
                  statusMessage={captchaStatus}
                />

                <button
                  type="submit"
                  disabled={submitting || !recaptchaSiteKey}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 px-6 py-3.5 font-bold text-white shadow-[0_18px_40px_rgba(124,58,237,0.35)] transition duration-200 hover:scale-[1.01] hover:shadow-[0_22px_50px_rgba(124,58,237,0.45)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {submitting ? "Creando cuenta..." : "Crear cuenta"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/", { state: { openLogin: true } })}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 font-medium text-white/90 transition hover:bg-white/10"
                >
                  <ArrowLeft className="h-4.5 w-4.5" />
                  Volver al login
                </button>
              </form>
            ) : (
              <div className="grid gap-6 text-center sm:text-left">
                <div className="rounded-[1.75rem] border border-emerald-300/20 bg-emerald-500/10 p-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-200 sm:mx-0">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="mt-5 text-2xl font-black text-white sm:text-3xl">
                    Registro completado
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                    {serverMessage ||
                      "Te enviamos un correo de verificación. Revisa tu bandeja de entrada para activar tu cuenta."}
                  </p>
                </div>

                <div className="grid gap-5 rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                  <div className="grid gap-5 sm:grid-cols-[1.2fr_0.8fr]">
                    <div className="grid gap-4">
                      <h3 className="text-lg font-semibold text-white">Reenviar verificación</h3>
                      <p className="text-sm leading-6 text-white/65">
                        Si no encuentras el correo, solicita un nuevo enlace desde aquí.
                      </p>
                    </div>
                    <form onSubmit={resendVerification} className="grid gap-4">
                      <label className="grid gap-2 text-left text-sm font-medium text-white/90">
                        <span>Correo electrónico</span>
                        <TextInput
                          id="resend_email"
                          name="resend_email"
                          type="email"
                          value={form.email}
                          onChange={() => {}}
                          readOnly
                          icon={Mail}
                          className="opacity-90"
                        />
                      </label>
                      <CaptchaField
                        siteKey={recaptchaSiteKey}
                        onChange={(token) => {
                          setCaptchaToken(token || "");
                          if (token) {
                            setErrors((current) => ({ ...current, resendCaptcha: undefined }));
                          }
                        }}
                        onErrored={() => {
                          setCaptchaToken("");
                          setErrors((current) => ({
                            ...current,
                            resendCaptcha: "No pudimos cargar el CAPTCHA para reenviar el correo.",
                          }));
                        }}
                        error={errors.resendCaptcha}
                      />
                      <button
                        type="submit"
                        disabled={resendSubmitting || !recaptchaSiteKey}
                        className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {resendSubmitting ? "Reenviando..." : "Reenviar correo de verificación"}
                      </button>
                    </form>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                    <button
                      type="button"
                      onClick={() => navigate("/", { state: { openLogin: true } })}
                      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 px-6 py-3 font-semibold text-white shadow-[0_18px_40px_rgba(124,58,237,0.35)] transition hover:scale-[1.01]"
                    >
                      Volver al login
                    </button>
                    <Link
                      to="/catalogo"
                      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white/90 transition hover:bg-white/10"
                    >
                      Ir al catálogo
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </AuthCard>
        </div>
      </div>
    </main>
  );
}