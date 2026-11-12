import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  signupController,
  verifySignupOtpController,
  resendSignupOtpController,
  loginController,
  meController,
  refreshController,
  logoutController,
  forgotPasswordController,
  verifyPasswordResetOtpController,
  resetPasswordController,
} from "../controllers/authController.js";

import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/authenticate.js";

import {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/authValidator.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
  },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification requests. Please try again later.",
  },
});

router.post("/signup", authLimiter, validate(signupSchema), signupController);

router.post(
  "/signup/verify-otp",
  authLimiter,
  validate(verifyOtpSchema),
  verifySignupOtpController
);

router.post(
  "/signup/resend-otp",
  otpLimiter,
  validate(resendOtpSchema),
  resendSignupOtpController
);

router.post("/login", authLimiter, validate(loginSchema), loginController);

router.post(
  "/forgot-password",
  otpLimiter,
  validate(forgotPasswordSchema),
  forgotPasswordController
);

router.post(
  "/forgot-password/verify-otp",
  otpLimiter,
  validate(verifyOtpSchema),
  verifyPasswordResetOtpController
);

router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  resetPasswordController
);
router.get("/me", authenticate, meController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);

export default router;
