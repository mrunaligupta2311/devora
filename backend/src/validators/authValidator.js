import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255).toLowerCase(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
  password: z.string().min(1).max(128),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
  code: z.string().regex(/^\d{6}$/, "Verification code must contain 6 digits."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
  code: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(8).max(128),
});
