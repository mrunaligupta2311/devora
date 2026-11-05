import React, { useState } from 'react';
import { ArrowRight, Layers3, Sparkles } from 'lucide-react';
import Button from '../../components/Button.jsx';
import './SignUp.css';
import { beginSignup } from '../../services/authService.js';

export default function SignUp({ go }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const submit = async event => {
    event.preventDefault();
    setError('');
    if (loading) return;

    if (password.length < 8) {
      setError('Your password must be at least 8 characters long.');
      return;
    }

    if (password !== confirm) {
      setError('Your passwords do not match. Please check them.');
      return;
    }

    setLoading(true);
    try {
      await beginSignup({ name, email, password });
      go('/otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-top">
        <button className="signup-brand" onClick={() => go('/login')}>
          <span className="brand-mark"><Layers3 size={20} /></span>
          <b>devora<span>.</span></b>
        </button>
        <span>Already have an account? <button onClick={() => go('/login')}>Sign in</button></span>
      </div>

      <div className="signup-main">
        <div className="signup-aside">
          <div className="signup-orb"><Sparkles size={38} /></div>
          <div className="eyebrow">A BETTER WAY TO BUILD</div>
          <h1>Make room for<br /><span className="gradient-text">your next idea.</span></h1>
          <p>Your own space to discover, plan and finish projects that matter to you.</p>
          <div className="signup-benefits">
            <span>✦ 225+ project ideas</span>
            <span>✦ Personal roadmaps</span>
            <span>✦ Progress that sticks</span>
          </div>
        </div>

        <section className="signup-form-panel">
          <div className="eyebrow">CREATE YOUR SPACE</div>
          <h2>Get started for free</h2>
          <p>Just the basics. You can personalize your experience next.</p>

          <form onSubmit={submit} className="signup-form">
            <label>
              Full name
              <input
                required
                value={name}
                onChange={event => setName(event.target.value)}
                autoComplete="name"
                placeholder="Alex Morgan"
              />
            </label>

            <label>
              Email address
              <input
                required
                type="email"
                value={email}
                onChange={event => {
                  setEmail(event.target.value);
                  setError('');
                }}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password
              <input
                required
                type="password"
                minLength={8}
                value={password}
                onChange={event => setPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
            </label>

            <label>
              Confirm password
              <input
                required
                type="password"
                value={confirm}
                onChange={event => setConfirm(event.target.value)}
                autoComplete="new-password"
                placeholder="Enter it again"
              />
            </label>

            {error && <div className="form-error" role="alert">{error}</div>}

            <Button type="submit" size="lg" disabled={loading}>
              {loading ? 'Creating your account...' : 'Continue to verification'} {!loading && <ArrowRight size={16} />}
            </Button>
          </form>

          <div className="signup-note">
            Your account will be ready after you complete the verification step.
          </div>
        </section>
      </div>
    </div>
  );
}
