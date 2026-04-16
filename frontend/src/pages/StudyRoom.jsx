import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { api } from '../lib/api';
import { getUser } from '../lib/auth';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export default function StudyRoom() {
  const user = getUser();
  const [studying, setStudying] = useState(false);
  const [studiers, setStudiers] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [totals, setTotals] = useState([]);
  const socketRef = useRef(null);
  const sessionId = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    api.sessionTotals().then(d => setTotals(d.totals || [])).catch(() => {});

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('study:update', (list) => {
      setStudiers(list);
    });

    return () => {
      stopStudying();
      socket.disconnect();
    };
  }, []);

  function startStudying() {
    setStudying(true);
    setElapsed(0);
    socketRef.current?.emit('study:start', { name: user?.full_name || 'Student' });
    api.startSession().then(d => { sessionId.current = d.session.id; }).catch(() => {});
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }

  function stopStudying() {
    if (!studying) return;
    setStudying(false);
    clearInterval(timerRef.current);
    socketRef.current?.emit('study:stop');
    if (sessionId.current) {
      api.endSession(sessionId.current).catch(() => {});
      sessionId.current = null;
    }
    api.sessionTotals().then(d => setTotals(d.totals || [])).catch(() => {});
  }

  const fmt = s => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2,'0')}m`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const fmtSeconds = s => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${sec}s`;
  };

  const totalMyHours = totals.reduce((sum, t) => sum + t.hours, 0).toFixed(1);

  return (
    <div className="container page">
      <h1 style={{ marginBottom: 6 }}>Study Room</h1>
      <p style={{ marginBottom: '2rem' }}>
        See who else is studying right now. Your timer runs while you study — it records your hours automatically.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Your timer */}
        <div className="card card-lg" style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Your session</h3>

          {/* Big clock */}
          <div style={{
            fontSize: '3rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
            color: studying ? 'var(--cyan-dark)' : 'var(--text-3)',
            marginBottom: '1.5rem', letterSpacing: '-0.02em',
          }}>
            {fmt(elapsed)}
          </div>

          <button
            className={`btn btn-lg ${studying ? 'btn-outline' : 'btn-primary'}`}
            style={{ width: '100%', marginBottom: '1rem' }}
            onClick={studying ? stopStudying : startStudying}
          >
            {studying ? '⏹ Stop studying' : '▶ Start studying'}
          </button>

          {studying && (
            <div className="alert alert-info" style={{ textAlign: 'left' }}>
              <span className="live-dot"></span>
              You are currently studying. Your time is being recorded.
            </div>
          )}

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--off-white)', borderRadius: 10 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 4 }}>Total hours studied</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--cyan-dark)' }}>{totalMyHours}h</div>
          </div>
        </div>

        {/* Who's studying now */}
        <div className="card card-lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <h3>Now studying</h3>
            <span className="badge badge-green">{studiers.length} online</span>
          </div>

          {studiers.length === 0 ? (
            <div className="empty" style={{ padding: '1.5rem 0' }}>
              <div className="empty-icon">🤫</div>
              <p style={{ fontSize: '0.875rem' }}>No one is studying right now. Start your session!</p>
            </div>
          ) : (
            studiers.map((s, i) => (
              <div key={i} className="studier-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--cyan-pale)', color: 'var(--cyan-dark)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.85rem'
                  }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="studier-name">{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>in this session</div>
                  </div>
                </div>
                <div className="studier-time">
                  <span className="live-dot"></span>
                  {fmtSeconds(s.secondsStudying)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Study history */}
      {totals.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Your study history</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {totals.slice(0, 14).map(t => (
              <div key={t.date} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-3)', width: 90, flexShrink: 0 }}>
                  {new Date(t.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </span>
                <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: 'var(--cyan)',
                    borderRadius: 4, width: `${Math.min((t.hours / 5) * 100, 100)}%`
                  }}></div>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cyan-dark)', width: 40 }}>
                  {t.hours}h
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
