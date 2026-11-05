import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { getRefreshTokenDurationMs } from "../utils/tokenExpiry.js";

const hashToken = (token) =>
  createHash("sha256").update(token).digest("hex");

function generateAccessToken(userId) {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m", algorithm: "HS256" }
  );
}

async function createSession(userId) {
  const refreshToken = randomBytes(48).toString("hex");
  const expiresAt = new Date(
    Date.now() +
    (getRefreshTokenDurationMs())
  );

  await prisma.userSession.create({
    data: {
      userId,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt,
    },
  });

  return { refreshToken, expiresAt };
}

export async function issueTokens(userId) {
  const session = await createSession(userId);

  return {
    accessToken: generateAccessToken(userId),
    refreshToken: session.refreshToken,
    refreshTokenExpiresAt: session.expiresAt,
  };
}

export async function signup(input) {
  const { requestSignupOtp } = await import("./otpService.js");
  return requestSignupOtp(input);
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await argon2.verify(user.passwordHash, password))) {
    throw new AppError("Invalid email or password.", 401);
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
  };

  const tokens = await issueTokens(user.id);

  return { user: safeUser, ...tokens };
}

export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError("User account not found.", 404);
  }

  return user;
}

export async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw new AppError("Refresh token required.", 401);
  }

  const session = await prisma.userSession.findUnique({
    where: { refreshTokenHash: hashToken(refreshToken) },
  });

  const now = new Date();

  if (!session || session.revokedAt || session.expiresAt <= now) {
    throw new AppError("Invalid or expired refresh token.", 401);
  }

  const newRefreshToken = randomBytes(48).toString("hex");
  const expiresAt = new Date(
    Date.now() +
    getRefreshTokenDurationMs()
  );

  const updated = await prisma.userSession.updateMany({
    where: {
      id: session.id,
      refreshTokenHash: hashToken(refreshToken),
      revokedAt: null,
      expiresAt: { gt: now },
    },
    data: {
      refreshTokenHash: hashToken(newRefreshToken),
      expiresAt,
    },
  });

  if (updated.count !== 1) {
    throw new AppError("Refresh token is no longer valid.", 401);
  }

  return {
    accessToken: generateAccessToken(session.userId),
    refreshToken: newRefreshToken,
    refreshTokenExpiresAt: expiresAt,
  };
}

export async function logoutSession(refreshToken) {
  if (!refreshToken) return;

  await prisma.userSession.updateMany({
    where: {
      refreshTokenHash: hashToken(refreshToken),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
