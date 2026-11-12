import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  ShieldCheck,
  LockKeyhole,
  CheckCircle2
} from 'lucide-react';

import Button from '../../components/Button.jsx';
import './ForgotPassword.css';

import {
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetDemoPassword
} from '../../services/authService.js';

export default function ForgotPassword({ go }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submitEmail = async event => {
    event.preventDefault();
    setError('');
    setMessage('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setBusy(true);

    try {
      const registeredEmail = await requestPasswordReset(normalizedEmail);
      setEmail(registeredEmail);
      setOtp('');
      setStep(2);
      setMessage('Verification code sent. Please check your email.');
    } catch (err) {
      setError(err.message || 'Unable to start password recovery.');
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async event => {
    event.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(otp)) {
      setError('Enter a valid 6-digit verification code.');
      return;
    }

    setBusy(true);

    try {
      await verifyPasswordResetOtp(otp);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = async event => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 8) {
      setError('Your new password must be at least 8 characters long.');
      return;
    }

    if (password !== confirm) {
      setError('Your passwords do not match. Please check them.');
      return;
    }

    setBusy(true);

    try {
      await resetDemoPassword(password, otp);
      setOtp('');
      setPassword('');
      setConfirm('');
      setStep(4);
      setMessage('Your password has been changed successfully.');
    } catch (err) {
      setError(err.message || 'Unable to update your password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="forgot-page">
      <button
        className="forgot-back"
        onClick={() => step === 1 ? go('/login') : setStep(step - 1)}
        disabled={busy}
      >
        <ArrowLeft size={15} />
        {step === 1 ? 'Back to login' : 'Go back'}
      </button>

      <section className="forgot-card">
        <div className="forgot-icon">
          {step === 1
            ? <Mail size={25} />
            : step === 4
              ? <CheckCircle2 size={25} />
              : <LockKeyhole size={25} />}
        </div>

        <div className="eyebrow">ACCOUNT RECOVERY</div>

        {step === 1 && (
          <>
            <h1>Forgot your password?</h1>
            <p>Enter the email address associated with your Devora account.</p>

            <form onSubmit={submitEmail} noValidate>
              <label>
                Email address
                <input
                  type="email"
                  required
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </label>

              {error && <div className="form-error" role="alert">{error}</div>}
              {message && <div className="form-success" role="status">{message}</div>}

              <Button type="submit" size="lg" disabled={busy}>
                {busy ? 'Sending...' : 'Continue'}
                {!busy && <ArrowRight size={16} />}
              </Button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1>Enter your code</h1>
            <p>Complete the verification step for <b>{email}</b>.</p>

            <form onSubmit={submitOtp} noValidate>
              <label>
                6-digit verification code
                <input
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                />
              </label>

              {error && <div className="form-error" role="alert">{error}</div>}

              <Button type="submit" size="lg" disabled={busy}>
                {busy ? 'Verifying...' : 'Verify code'}
                {!busy && <ArrowRight size={16} />}
              </Button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h1>Create a new password</h1>
            <p>Choose a new password for your Devora account.</p>

            <form onSubmit={submitPassword} noValidate>
              <label>
                New password
                <input
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
              </label>

              <label>
                Confirm new password
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={event => setConfirm(event.target.value)}
                  placeholder="Enter it again"
                />
              </label>

              {error && <div className="form-error" role="alert">{error}</div>}

              <Button type="submit" size="lg" disabled={busy}>
                {busy ? 'Updating...' : 'Save new password'}
                {!busy && <ArrowRight size={16} />}
              </Button>
            </form>
          </>
        )}

        {step === 4 && (
          <>
            <h1>Password updated!</h1>

            <div className="forgot-success" role="status">
              <ShieldCheck size={17} />
              {message}
            </div>

            <p>You can now sign in using your new password.</p>

            <Button type="button" size="lg" onClick={() => go('/login')}>
              Back to login <ArrowRight size={16} />
            </Button>
          </>
        )}
      </section>
    </div>
  );
}
