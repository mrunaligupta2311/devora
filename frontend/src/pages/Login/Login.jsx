import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Layers3, Sparkles } from 'lucide-react';
import Button from '../../components/Button.jsx';
import './Login.css';
import { loginDemo } from '../../services/authService.js';
import { useApp } from '../../context/AppContext.jsx';

export default function Login({ go }) {
  const { login, notify } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async event => {
    event.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const account = await loginDemo({ email, password });
      await login(account);
      notify('Welcome back to Devora.');
      go('/dashboard');
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="brand-mark"><Layers3 size={22} /></div>
          <strong>devora<span>.</span></strong>
        </div>

        <div className="auth-art-copy">
          <div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div>
          <h1>Ideas are easy.<br /><span className="gradient-text">Building is magic.</span></h1>
          <p>Find projects that fit your skills, turn curiosity into momentum, and make progress you can actually see.</p>
          <div className="auth-mini-stats">
            <div><b>234</b><span>project ideas</span></div>
            <i />
            <div><b>09</b><span>fields to explore</span></div>
            <i />
            <div><b>∞</b><span>ways to grow</span></div>
          </div>
        </div>

        <div className="auth-quote">
          <span>✦</span> “The secret of getting ahead is getting started.”
          <small>— Mark Twain</small>
        </div>
        <div className="auth-decoration deco-a" />
        <div className="auth-decoration deco-b" />
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <div className="brand-mark"><Layers3 size={20} /></div>
            <strong>devora<span>.</span></strong>
          </div>

          <div className="auth-kicker"><Sparkles size={14} /> YOUR BUILDING SPACE</div>
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Pick up where your next big idea begins.</p>

          <form onSubmit={submit} className="auth-form">
            <label>
              Email address
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password
              <div className="password-wrap">
                <input
                  type={show ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div className="auth-inline">
              <span>Account access</span>
              <button type="button" onClick={() => go('/forgot-password')}>
                Forgot password?
              </button>
            </div>

            {error && <div className="form-error" role="alert">{error}</div>}

            <Button type="submit" size="lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight size={16} />}
            </Button>
          </form>

          <div className="auth-divider"><span>NEW TO DEVORA?</span></div>

          <Button variant="secondary" size="lg" onClick={() => go('/signup')}>
            Create an account
          </Button>

          <div className="auth-legal">
            By continuing, you agree to our terms and privacy notice.
          </div>
        </div>
      </div>
    </div>
  );
}
