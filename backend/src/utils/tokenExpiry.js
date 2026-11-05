const DURATION_PATTERN = /^(\d+)\s*(d|h|m|s)?$/i;

export function getRefreshTokenDurationMs() {
  const value =
    process.env.REFRESH_TOKEN_EXPIRES_IN ||
    process.env.REFRESH_TOKEN_DAYS ||
    "7d";

  const match = String(value).trim().match(DURATION_PATTERN);

  if (!match) {
    throw new Error("Invalid REFRESH_TOKEN_EXPIRES_IN configuration.");
  }

  const amount = Number(match[1]);
  const unit = (match[2] || "d").toLowerCase();

  const multipliers = {
    d: 86400000,
    h: 3600000,
    m: 60000,
    s: 1000,
  };

  const duration = amount * multipliers[unit];

  if (!Number.isSafeInteger(duration) || duration <= 0) {
    throw new Error("Refresh token duration must be a positive safe integer.");
  }

  return duration;
}
