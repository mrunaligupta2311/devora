import argon2 from "argon2";
import { randomInt, createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { sendBrevoEmail } from "./emailService.js";
import { otpConfig } from "../config/otpConfig.js";

const { ttlMinutes: ttl, maxAttempts } = otpConfig;

function hashOtp(email, code) {
  const secret = process.env.OTP_HASH_SECRET;
  if (!secret) throw new AppError("OTP security configuration is missing.", 503);

  return createHmac("sha256", secret)
    .update(`${email}:${code}`)
    .digest("hex");
}

export async function requestPasswordReset({ email }) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  // Avoid revealing whether an account exists.
  if (!user) {
    return { message: "If the account exists, a verification code will be sent." };
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
    await prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => {});
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
    message: "If the account exists, a verification code will be sent.",
    expiresAt: record.expiresAt,
  };
}

export async function resetPassword({ email, code, newPassword }) {
  const record = await prisma.otpVerification.findFirst({
    where: {
      email,
      purpose: "PASSWORD_RESET",
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) throw new AppError("Invalid or expired verification code.", 400);
  if (record.expiresAt <= new Date()) {
    throw new AppError("Verification code has expired. Request a new one.", 410);
  }
  if (record.attempts >= maxAttempts) {
    throw new AppError("Too many incorrect attempts. Request a new code.", 429);
  }

  const submitted = Buffer.from(hashOtp(email, code), "hex");
  const stored = Buffer.from(record.codeHash, "hex");
  const valid = submitted.length === stored.length && timingSafeEqual(submitted, stored);

  if (!valid) {
    await prisma.otpVerification.updateMany({
      where: { id: record.id, consumedAt: null },
      data: { attempts: { increment: 1 } },
    });
    throw new AppError("Invalid or expired verification code.", 400);
  }

  const passwordHash = await argon2.hash(newPassword);

  await prisma.$transaction(async (tx) => {
    const consumed = await tx.otpVerification.updateMany({
      where: {
        id: record.id,
        consumedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lt: maxAttempts },
      },
      data: { consumedAt: new Date() },
    });

    if (consumed.count !== 1) {
      throw new AppError("Verification code is no longer valid.", 409);
    }

    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });

    // Revoke all existing refresh sessions after password reset.
    await tx.userSession.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });

  await prisma.otpVerification.deleteMany({
    where: { email, purpose: "PASSWORD_RESET" },
  });

  return { message: "Password reset successfully. Please log in again." };
}
