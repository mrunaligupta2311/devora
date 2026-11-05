import { getRefreshTokenDurationMs } from "../utils/tokenExpiry.js";

import {
  signup,
  login,
  getCurrentUser,
  refreshSession,
  logoutSession,
} from "../services/authService.js";

import {
  verifySignupOtp,
  resendSignupOtp,
} from "../services/otpService.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
  maxAge: getRefreshTokenDurationMs(),
};

function sendAuthResponse(res, result, statusCode) {
  const { refreshToken, refreshTokenExpiresAt, ...response } = result;

  res.cookie("devora_refresh", refreshToken, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    data: response,
  });
}

export async function signupController(req, res, next) {
  try {
    const result = await signup(req.validated.body);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function verifySignupOtpController(req, res, next) {
  try {
    const result = await verifySignupOtp(req.validated.body);
    return sendAuthResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
}

export async function resendSignupOtpController(req, res, next) {
  try {
    const result = await resendSignupOtp(req.validated.body);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function loginController(req, res, next) {
  try {
    const result = await login(req.validated.body);
    return sendAuthResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
}

export async function meController(req, res, next) {
  try {
    const user = await getCurrentUser(req.user.id);
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
}

export async function refreshController(req, res, next) {
  try {
    const result = await refreshSession(req.cookies?.devora_refresh);
    return sendAuthResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
}

export async function logoutController(req, res, next) {
  try {
    await logoutSession(req.cookies?.devora_refresh);
    res.clearCookie("devora_refresh", cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
}

import {
  requestPasswordReset,
  resetPassword,
} from "../services/passwordResetService.js";

export async function forgotPasswordController(req, res, next) {
  try {
    const result = await requestPasswordReset(req.validated.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordController(req, res, next) {
  try {
    const result = await resetPassword(req.validated.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
