export const RECAPTCHA_V2_TEST_SITE_KEY =
  "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhM";

export const RECAPTCHA_V2_TEST_SECRET =
  "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

export function getRecaptchaSiteKey() {
  const configuredKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim();

  if (configuredKey) {
    return configuredKey;
  }

  return import.meta.env.DEV ? RECAPTCHA_V2_TEST_SITE_KEY : "";
}

export function getRecaptchaConfigIssue(siteKey) {
  if (!siteKey) {
    return "Define VITE_RECAPTCHA_SITE_KEY para habilitar el registro.";
  }

  if (siteKey === RECAPTCHA_V2_TEST_SECRET) {
    return "VITE_RECAPTCHA_SITE_KEY contiene el secret en lugar del site key.";
  }

  return "";
}