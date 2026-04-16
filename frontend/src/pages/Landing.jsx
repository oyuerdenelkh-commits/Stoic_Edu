import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { saveAuth } from '../lib/auth';

export default function Landing() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (mode === 'register') {
        data = await api.register(form);
      } else {
        data = await api.login({ email: form.email, password: form.password });
      }
      saveAuth(data.token, data.user);
      if (!data.user.plan_level) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'var(--off-white)',
      padding: '2rem'
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <img src="/logo.png" alt="Stoic Edu" style={{ width: 80, height: 80, objectFit: 'contain' }} />
          <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)' }}>Stoic Edu</span>
        </div>
        <h1 style={{ marginBottom: 8 }}>SAT &amp; IELTS Preparation</h1>
        <p style={{ color: 'var(--text-2)', maxWidth: 420, margin: '0 auto' }}>
          Structured 50-day SAT prep with daily tasks, vocabulary building, and progress tracking — designed for international students.
        </p>
      </div>

      {/* Auth card */}
      <div className="card card-lg" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 1.5 + 'rem' }}>
          <button
            className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => { setMode('login'); setError(''); }}
          >Sign in</button>
          <button
            className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => { setMode('register'); setError(''); }}
          >Create account</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>Full name</label>
              <input className="input" name="full_name" value={form.full_name}
                onChange={update} placeholder="Your full name" required />
            </div>
          )}
          <div className="form-group">
            <label>Email address</label>
            <input className="input" type="email" name="email" value={form.email}
              onChange={update} placeholder="you@email.com" required />
          </div>
          <div className="form-group">
            <label>Password{mode === 'register' ? ' (min 8 characters)' : ''}</label>
            <input className="input" type="password" name="password" value={form.password}
              onChange={update} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}
            disabled={loading}>
            {loading ? 'Please wait…' : mode === 'register' ? 'Create my account' : 'Sign in'}
          </button>
        </form>

        {mode === 'register' && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', textAlign: 'center', marginTop: 14 }}>
            After sign-up, you'll choose your study plan level.
          </p>
        )}
      </div>
    </div>
  );
}
