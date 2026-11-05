export function readPositiveInteger(name, fallback) {
  const raw = process.env[name];
  const value = raw === undefined || raw.trim() === ""
    ? fallback
    : Number(raw);

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return value;
}

export const otpConfig = Object.freeze({
  ttlMinutes: readPositiveInteger("OTP_TTL_MINUTES", 10),
  maxAttempts: readPositiveInteger("OTP_MAX_ATTEMPTS", 5),
  cooldownSeconds: readPositiveInteger("OTP_RESEND_COOLDOWN_SECONDS", 60),
});
