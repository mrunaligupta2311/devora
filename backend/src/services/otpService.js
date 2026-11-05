import { randomInt, createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { sendBrevoEmail } from "./emailService.js";
import { otpConfig } from "../config/otpConfig.js";

const { ttlMinutes, maxAttempts, cooldownSeconds } = otpConfig;

function hashOtp(email, code) {
  const secret = process.env.OTP_HASH_SECRET;

  if (!secret) {
    throw new AppError("OTP security configuration is missing.", 503);
  }

  return createHmac("sha256", secret)
    .update(`${email}:${code}`)
    .digest("hex");
}

function generateOtp() {
  return String(randomInt(100000, 1000000));
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

async function deliverSignupOtp(record, code) {
  const safeName = escapeHtml(record.name || "there");

  await sendBrevoEmail({
    to: record.email,
    name: record.name,
    subject: "Verify your Devora account",
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:30px;color:#222">
        <h2>Welcome to Devora, ${safeName}!</h2>
        <p>Use this verification code to complete your account registration:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:9px;padding:20px;background:#f3f4f6;text-align:center;border-radius:10px">
          ${code}
        </div>
        <p>This code expires in ${ttlMinutes} minutes.</p>
        <p>If you did not request this code, you can ignore this email.</p>
        <p>— Team Devora</p>
      </div>
    `,
  });
}

export async function requestSignupOtp({ name, email, password }) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const passwordHash = await import("argon2").then((module) =>
    module.default.hash(password)
  );

  const code = generateOtp();

  await prisma.otpVerification.deleteMany({
    where: { email, purpose: "SIGNUP", consumedAt: null },
  });

  const record = await prisma.otpVerification.create({
    data: {
      name,
      email,
      passwordHash,
      codeHash: hashOtp(email, code),
      purpose: "SIGNUP",
      expiresAt: new Date(Date.now() + ttlMinutes * 60000),
    },
  });

  try {
    await deliverSignupOtp(record, code);
  } catch (error) {
    await prisma.otpVerification.delete({
      where: { id: record.id },
    }).catch(() => {});
    throw error;
  }

  return {
    email,
    expiresAt: record.expiresAt,
    message: "Verification code sent to your email.",
  };
}

export async function resendSignupOtp({ email }) {
  const record = await prisma.otpVerification.findFirst({
    where: {
      email,
      purpose: "SIGNUP",
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new AppError("No pending signup found. Please sign up again.", 404);
  }

  const elapsed = Date.now() - record.createdAt.getTime();

  if (elapsed < cooldownSeconds * 1000) {
    const remaining = Math.ceil((cooldownSeconds * 1000 - elapsed) / 1000);
    throw new AppError(`Please wait ${remaining} seconds before requesting another code.`, 429);
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60000);

  await deliverSignupOtp(record, code);

  const updated = await prisma.otpVerification.updateMany({
    where: {
      id: record.id,
      consumedAt: null,
      createdAt: record.createdAt,
      codeHash: record.codeHash,
    },
    data: {
      codeHash: hashOtp(email, code),
      attempts: 0,
      expiresAt,
      createdAt: new Date(),
    },
  });

  if (updated.count !== 1) {
    throw new AppError(
      "Verification request changed. Please request a new code.",
      409
    );
  }

  return {
    email,
    expiresAt,
    message: "A new verification code has been sent.",
  };
}

export async function verifySignupOtp({ email, code }) {
  const record = await prisma.otpVerification.findFirst({
    where: {
      email,
      purpose: "SIGNUP",
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new AppError("No pending signup found. Please sign up again.", 404);
  }

  if (record.expiresAt <= new Date()) {
    throw new AppError("Verification code has expired. Please request a new one.", 410);
  }

  if (record.attempts >= maxAttempts) {
    throw new AppError("Too many incorrect attempts. Please request a new code.", 429);
  }

  const submittedHash = Buffer.from(hashOtp(email, code), "hex");
  const storedHash = Buffer.from(record.codeHash, "hex");

  const valid =
    submittedHash.length === storedHash.length &&
    timingSafeEqual(submittedHash, storedHash);

  if (!valid) {
    const updated = await prisma.otpVerification.updateMany({
      where: {
        id: record.id,
        consumedAt: null,
      },
      data: { attempts: { increment: 1 } },
    });

    if (updated.count !== 1) {
      throw new AppError("Verification request is no longer valid.", 409);
    }

    const attemptsLeft = Math.max(0, maxAttempts - record.attempts - 1);

    throw new AppError(
      attemptsLeft
        ? `Incorrect verification code. ${attemptsLeft} attempts remaining.`
        : "Too many incorrect attempts. Please request a new code.",
      attemptsLeft ? 400 : 429
    );
  }

  const user = await prisma.$transaction(async (tx) => {
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
      throw new AppError("Verification code is no longer valid. Please try again.", 409);
    }

    return tx.user.create({
      data: {
        name: record.name,
        email: record.email,
        passwordHash: record.passwordHash,
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });
  });

  const { issueTokens } = await import("./authService.js");
  const tokens = await issueTokens(user.id);

  await prisma.otpVerification.deleteMany({
    where: { email, purpose: "SIGNUP" },
  });

  return { user, ...tokens };
}
