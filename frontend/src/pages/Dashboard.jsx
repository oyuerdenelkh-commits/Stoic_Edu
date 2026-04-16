import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getUser } from '../lib/auth';

const PLAN_NAMES  = { 1: 'Intensive', 2: 'Mid-Level', 3: 'Light' };
const PLAN_COLORS = { 1: 'var(--danger)', 2: 'var(--warning)', 3: 'var(--success)' };

export default function Dashboard() {
  const user = getUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [vocab, setVocab] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.plan_level) { navigate('/onboarding'); return; }
    Promise.all([api.stats(), api.getVocab()])
      .then(([s, v]) => {
        setStats(s);
        setVocab(v.vocabulary.slice(0, 6));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container page"><div className="spinner"></div></div>;

  const day = stats?.current_day || 1;
  const planColor = PLAN_COLORS[user?.plan_level] || 'var(--cyan)';
  const planName  = PLAN_NAMES[user?.plan_level]  || '';

  return (
    <div className="container page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span className="badge" style={{ background: planColor + '22', color: planColor }}>
              Plan {user?.plan_level} — {planName}
            </span>
            <span className="badge badge-cyan">Day {day} of 50</span>
          </div>
        </div>
        <Link to={`/session/${day}`} className="btn btn-primary btn-lg">
          Start today — Day {day}
        </Link>
      </div>

      {/* Progress bar for 50-day program */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 600 }}>50-Day SAT Program</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>{day}/50 days</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(day / 50) * 100}%` }}></div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-value">{stats?.completed_sections || 0}</div>
          <div className="stat-label">Sections done</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.total_study_hours || 0}h</div>
          <div className="stat-label">Total studied</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.total_vocab || 0}</div>
          <div className="stat-label">Words saved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.total_mistakes || 0}</div>
          <div className="stat-label">Mistakes logged</div>
        </div>
      </div>

      {/* Two column: Vocab widget + Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Vocabulary widget */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>My Vocabulary</h3>
            <Link to="/vocabulary" className="btn btn-outline btn-sm">View all</Link>
          </div>
          {vocab.length === 0 ? (
            <div className="empty" style={{ padding: '1.5rem 0' }}>
              <div className="empty-icon">📖</div>
              <p style={{ fontSize: '0.875rem' }}>No words yet. Add words during your study session.</p>
            </div>
          ) : (
            <>
              {vocab.map(v => (
                <div key={v.id} className="vocab-entry">
                  <div style={{ flex: 1 }}>
                    <div className="vocab-word">{v.word}</div>
                    {v.definition && <div className="vocab-def">{v.definition}</div>}
                  </div>
                </div>
              ))}
              {stats?.total_vocab > 6 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 8 }}>
                  +{stats.total_vocab - 6} more words
                </p>
              )}
            </>
          )}
        </div>

        {/* Quick links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ marginBottom: 12 }}>Quick links</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/calendar" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
                📅 50-day calendar
              </Link>
              <Link to={`/session/${day}`} className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
                ✏️ Today's session — Day {day}
              </Link>
              <Link to="/study-room" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
                🕐 Study room
              </Link>
              <Link to="/vocabulary" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
                📖 Vocabulary notepad
              </Link>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--cyan-pale)', border: '1px solid var(--cyan-light)' }}>
            <h3 style={{ color: 'var(--cyan-dark)', marginBottom: 6 }}>Today's goal</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--cyan-dark)' }}>
              Complete all Day {day} sections and log any new vocabulary or mistakes you encounter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
