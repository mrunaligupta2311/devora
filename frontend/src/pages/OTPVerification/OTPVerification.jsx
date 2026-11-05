import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, MailCheck } from 'lucide-react';
import Button from '../../components/Button.jsx';
import './OTPVerification.css';
import { verifyDemoOtp, resendSignupOtp } from '../../services/authService.js';
import { useApp } from '../../context/AppContext.jsx';

export default function OTPVerification({ go }) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');

  const { login, notify } = useApp();
  const email = sessionStorage.getItem('devora.pendingSignupEmail');

  const submit = async event => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setBusy(true);

    try {
      const account = await verifyDemoOtp(otp);
      await login(account);
      notify('Your account has been created successfully.');
      go('/onboarding', true);
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError('');
    setMessage('');
    setResending(true);

    try {
      await resendSignupOtp();
      setMessage('A new verification code has been sent to your email.');
    } catch (err) {
      setError(err.message || 'Could not resend the verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="otp-page">
      <button className="otp-back" onClick={() => go('/signup')}>
        <ArrowLeft size={15} /> Back to signup
      </button>

      <section className="otp-card">
        <div className="otp-icon"><MailCheck size={28} /></div>
        <div className="eyebrow">ONE LAST STEP</div>
        <h1>Verify your email</h1>
        <p>
          Complete the verification step for {email || 'your email address'}.
        </p>

        <form onSubmit={submit}>
          <label htmlFor="verification-code">6-digit verification code</label>
          <input
            id="verification-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            required
          />

          {error && <div className="form-error" role="alert">{error}</div>}
          {message && <div className="form-success" role="status">{message}</div>}

          <Button type="submit" size="lg" disabled={busy || !email}>
            {busy ? 'Verifying...' : 'Verify and continue'}
            {!busy && <ArrowRight size={16} />}
          </Button>
        </form>

        <button
          type="button"
          className="otp-resend"
          onClick={resend}
          disabled={resending || busy || !email}
        >
          {resending ? 'Sending...' : 'Resend verification code'}
        </button>
      </section>
    </div>
  );
}
