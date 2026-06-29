import React from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { ShieldAlert } from "lucide-react";
import { getRecaptchaConfigIssue } from "../../config/recaptcha";

const CaptchaField = ({ siteKey, onChange, onErrored, error, statusMessage }) => {
  const configIssue = getRecaptchaConfigIssue(siteKey);

  if (configIssue) {
    return (
      <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-200" />
          <div>
            <p className="font-semibold">CAPTCHA no configurado</p>
            <p className="mt-1 text-amber-100/80">
              {configIssue}
            </p>
            <p className="mt-2 text-amber-100/70">
              Esta pantalla usa reCAPTCHA v2 checkbox. Si tu clave pertenece a otro proyecto, o no autorizaste localhost, Google la rechazará.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Verificación anti-bots</p>
          <p className="text-xs text-white/55">Completa el CAPTCHA para continuar.</p>
        </div>
        {statusMessage ? <p className="text-xs text-white/50">{statusMessage}</p> : null}
      </div>
      <div className="overflow-hidden rounded-2xl bg-white p-1">
        <ReCAPTCHA
          sitekey={siteKey}
          onChange={onChange}
          onErrored={onErrored}
          onExpired={() => onChange(null)}
        />
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
};

export default CaptchaField;