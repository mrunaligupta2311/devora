import {
  apiRequest,
  getAccessToken,
  refreshAccessToken,
  setAccessToken
} from './api.js';

const normalizeEmail = email => String(email || '').trim().toLowerCase();

export const beginSignup = async ({ name, email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  const data = await apiRequest('/auth/signup', {
    method: 'POST',
    auth: false,
    body: { name: String(name || '').trim(), email: normalizedEmail, password }
  });

  sessionStorage.setItem('devora.pendingSignupEmail', normalizedEmail);
  return data;
};

export const verifyDemoOtp = async otp => {
  const email = sessionStorage.getItem('devora.pendingSignupEmail');

  if (!email) throw new Error('Signup session expired. Please sign up again.');

  const data = await apiRequest('/auth/signup/verify-otp', {
    method: 'POST',
    auth: false,
    body: { email, code: String(otp).trim() }
  });

  setAccessToken(data.accessToken);
  sessionStorage.removeItem('devora.pendingSignupEmail');

  return data.user;
};

export const resendSignupOtp = async () => {
  const email = sessionStorage.getItem('devora.pendingSignupEmail');

  if (!email) throw new Error('Signup session expired. Please sign up again.');

  return apiRequest('/auth/signup/resend-otp', {
    method: 'POST',
    auth: false,
    body: { email }
  });
};

export const loginDemo = async ({ email, password }) => {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email: normalizeEmail(email), password }
  });

  setAccessToken(data.accessToken);
  return data.user;
};

export const restoreSession = async () => {
  if (!getAccessToken()) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return null;
  }

  try {
    const data = await apiRequest('/auth/me');
    return data.user;
  } catch {
    setAccessToken(null);
    return null;
  }
};

export const logoutDemo = async () => {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } finally {
    setAccessToken(null);
  }
};

export const hasSession = () => !!getAccessToken();

export const currentUser = () => null;

export const requestPasswordReset = async email => {
  const normalizedEmail = normalizeEmail(email);

  await apiRequest('/auth/forgot-password', {
    method: 'POST',
    auth: false,
    body: { email: normalizedEmail }
  });

  sessionStorage.setItem('devora.pendingPasswordReset', normalizedEmail);
  return normalizedEmail;
};

export const verifyPasswordResetOtp = async otp => {
  if (!/^\d{6}$/.test(String(otp))) {
    throw new Error('Enter a valid 6-digit OTP.');
  }

  if (!sessionStorage.getItem('devora.pendingPasswordReset')) {
    throw new Error('Password reset session expired. Please try again.');
  }

  sessionStorage.setItem('devora.passwordResetCode', String(otp));
  return true;
};

export const resetDemoPassword = async password => {
  const email = sessionStorage.getItem('devora.pendingPasswordReset');
  const code = sessionStorage.getItem('devora.passwordResetCode');

  if (!email || !code) {
    throw new Error('Password reset session expired. Please start again.');
  }

  const data = await apiRequest('/auth/reset-password', {
    method: 'POST',
    auth: false,
    body: { email, code, newPassword: password }
  });

  sessionStorage.removeItem('devora.pendingPasswordReset');
  sessionStorage.removeItem('devora.passwordResetCode');

  return data;
};

export const updateDemoProfile = async ({ name }) => {
  return apiRequest('/users/profile', {
    method: 'PATCH',
    body: { name: String(name || '').trim() }
  });
};
