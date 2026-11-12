import argon2 from "argon2";
import { randomInt, createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { sendBrevoEmail } from "./emailService.js";
import { otpConfig } from "../config/otpConfig.js";

const { ttlMinutes: ttl, maxAttempts } = otpConfig;

function hashOtp(email, code) {
  const secret = process.env.OTP_HASH_SECRET;

  if (!secret) {
    throw new AppError("OTP security configuration is missing.", 503);
  }

  return createHmac("sha256", secret)
    .update(`${email}:${code}`)
    .digest("hex");
}

function isValidOtp(email, code, storedHash) {
  const submitted = Buffer.from(hashOtp(email, code), "hex");
  const stored = Buffer.from(storedHash, "hex");

  return submitted.length === stored.length &&
    timingSafeEqual(submitted, stored);
}

async function getActiveResetOtp(email) {
  const record = await prisma.otpVerification.findFirst({
    where: {
      email,
      purpose: "PASSWORD_RESET",
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new AppError("Invalid or expired verification code.", 400);
  }

  if (record.expiresAt <= new Date()) {
    throw new AppError(
      "Verification code has expired. Request a new one.",
      410
    );
  }

  if (record.attempts >= maxAttempts) {
    throw new AppError(
      "Too many incorrect attempts. Request a new code.",
      429
    );
  }

  return record;
}

async function recordFailedAttempt(record) {
  const result = await prisma.otpVerification.updateMany({
    where: {
      id: record.id,
      consumedAt: null,
      expiresAt: { gt: new Date() },
      attempts: { lt: maxAttempts },
    },
    data: {
      attempts: { increment: 1 },
    },
  });

  if (result.count === 1) {
    throw new AppError("Invalid verification code. Please try again.", 400);
  }

  const latest = await prisma.otpVerification.findUnique({
    where: { id: record.id },
    select: {
      consumedAt: true,
      expiresAt: true,
      attempts: true,
    },
  });

  if (!latest || latest.consumedAt) {
    throw new AppError("Invalid or expired verification code.", 400);
  }

  if (latest.expiresAt <= new Date()) {
    throw new AppError(
      "Verification code has expired. Request a new one.",
      410
    );
  }

  if (latest.attempts >= maxAttempts) {
    throw new AppError(
      "Too many incorrect attempts. Request a new code.",
      429
    );
  }

  throw new AppError("Invalid or expired verification code.", 400);
}

export async function requestPasswordReset({ email }) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    throw new AppError(
      "No Devora account exists with this email address.",
      404
    );
  }

  const code = String(randomInt(100000, 1000000));

  const record = await prisma.otpVerification.create({
    data: {
      userId: user.id,
      email,
      name: user.name,
      codeHash: hashOtp(email, code),
      purpose: "PASSWORD_RESET",
      expiresAt: new Date(Date.now() + ttl * 60000),
    },
  });

  try {
    await sendBrevoEmail({
      to: email,
      name: user.name,
      subject: "Reset your Devora password",
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:30px;color:#222">
          <h2>Password reset request</h2>
          <p>Hello ${String(user.name).replace(/[&<>"']/g, "")},</p>
          <p>Your Devora password reset code is:</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:9px;padding:20px;background:#f3f4f6;text-align:center;border-radius:10px">${code}</div>
          <p>This code expires in ${ttl} minutes. If you did not request this, ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    await prisma.otpVerification
      .delete({ where: { id: record.id } })
      .catch(() => {});
    throw error;
  }

  await prisma.otpVerification.deleteMany({
    where: {
      email,
      purpose: "PASSWORD_RESET",
      consumedAt: null,
      id: { not: record.id },
    },
  });

  return {
    message: "Verification code sent successfully.",
    expiresAt: record.expiresAt,
  };
}

export async function verifyPasswordResetOtp({ email, code }) {
  const record = await getActiveResetOtp(email);

  if (!isValidOtp(email, code, record.codeHash)) {
    await recordFailedAttempt(record);
  }

  return { message: "Verification code confirmed." };
}

export async function resetPassword({ email, code, newPassword }) {
  const record = await getActiveResetOtp(email);

  if (!isValidOtp(email, code, record.codeHash)) {
    await recordFailedAttempt(record);
  }

  const passwordHash = await argon2.hash(newPassword);

  await prisma.$transaction(async (tx) => {
    const now = new Date();

    const consumed = await tx.otpVerification.updateMany({
      where: {
        id: record.id,
        consumedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: maxAttempts },
      },
      data: { consumedAt: now },
    });

    if (consumed.count !== 1) {
      throw new AppError("Verification code is no longer valid.", 409);
    }

    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });

    await tx.userSession.updateMany({
      where: {
        userId: record.userId,
        revokedAt: null,
      },
      data: { revokedAt: now },
    });
  });

  await prisma.otpVerification.deleteMany({
    where: {
      email,
      purpose: "PASSWORD_RESET",
    },
  });

  return {
    message: "Password reset successfully. Please log in again.",
  };
}
