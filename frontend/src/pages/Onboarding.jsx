import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getUser, saveAuth } from '../lib/auth';

const PLANS = [
  {
    level: 1,
    name: 'Intensive',
    color: 'var(--danger)',
    badge: 'badge-red',
    description: 'Maximum improvement, maximum discipline.',
    features: [
      'Daily IELTS reading & listening for English foundations',
      'Full SAT math + English practice every day',
      'Strict daily deadlines — assignments must be done on time',
      'Vocabulary accumulation from IELTS passages',
      'Best for: students whose English needs significant improvement',
    ],
    hours: '3–4 hours/day',
  },
  {
    level: 2,
    name: 'Mid-Level',
    color: 'var(--warning)',
    badge: 'badge-orange',
    description: 'Balanced prep focused on improvement and mistake correction.',
    features: [
      'Targeted SAT English and math practice',
      'Mistake review sessions built into schedule',
      'Some IELTS passages for vocabulary and reading skills',
      'Moderate deadlines with flexibility',
      'Best for: students with decent English who want SAT improvement',
    ],
    hours: '1.5–2.5 hours/day',
  },
  {
    level: 3,
    name: 'Light',
    color: 'var(--success)',
    badge: 'badge-green',
    description: 'Flexible prep that prioritizes fixing your weak spots.',
    features: [
      'Focus on reviewing and understanding your mistakes',
      'Targeted practice on weak areas only',
      'Flexible daily schedule — no hard deadlines',
      'Vocabulary building from practice questions',
      'Best for: students with strong English who need targeted SAT prep',
    ],
    hours: '1–1.5 hours/day',
  },
];

export default function Onboarding() {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = getUser();

  async function confirm() {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.setPlan(selected);
      // Update stored user
      const updated = { ...user, plan_level: data.user.plan_level, start_date: data.user.start_date };
      saveAuth(localStorage.getItem('stoic_token'), updated);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', padding: '2.5rem 1.25rem' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
            <img src="/logo.png" alt="Stoic Edu" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Stoic Edu</span>
          </div>
          <h1>Choose your study plan</h1>
          <p style={{ marginTop: 8, maxWidth: 480, margin: '8px auto 0' }}>
            Welcome, {user?.full_name?.split(' ')[0]}! Pick the intensity level that fits your goals and available time.
            You can always ask your teacher to change this later.
          </p>
        </div>

        {error && <div className="alert alert-error" style={{ maxWidth: 500, margin: '0 auto 1rem' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: '2rem' }}>
          {PLANS.map(plan => (
            <div
              key={plan.level}
              className="card"
              onClick={() => setSelected(plan.level)}
              style={{
                cursor: 'pointer',
                borderColor: selected === plan.level ? plan.color : 'var(--border)',
                borderWidth: selected === plan.level ? 2 : 1,
                boxShadow: selected === plan.level ? `0 0 0 3px ${plan.color}22` : 'none',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              {selected === plan.level && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  width: 20, height: 20, borderRadius: '50%',
                  background: plan.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: plan.color + '22', color: plan.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.9rem'
                }}>{plan.level}</span>
                <div>
                  <h3 style={{ margin: 0 }}>{plan.name}</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{plan.hours}</span>
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', marginBottom: 12 }}>{plan.description}</p>
              <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, fontSize: '0.825rem', color: 'var(--text-2)' }}>
                    <span style={{ color: plan.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={confirm}
            disabled={!selected || loading}
          >
            {loading ? 'Setting up your plan…' : selected ? `Start with ${PLANS.find(p => p.level === selected)?.name} plan` : 'Select a plan above'}
          </button>
        </div>
      </div>
    </div>
  );
}
