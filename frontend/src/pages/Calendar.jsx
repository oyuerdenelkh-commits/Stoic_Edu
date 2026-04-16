import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { getUser } from '../lib/auth';

export default function Calendar() {
  const user = getUser();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentDay = getCurrentDay(user?.start_date);

  useEffect(() => {
    api.progress()
      .then(d => setProgress(d.progress || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Get set of completed day numbers
  const completedDays = new Set(
    progress.filter(p => p.completed).map(p => p.sections?.day_number).filter(Boolean)
  );

  // Group into weeks of 5 days (Mon–Fri)
  const weeks = [];
  for (let w = 0; w < 10; w++) {
    const week = [];
    for (let d = 0; d < 5; d++) {
      week.push(w * 5 + d + 1);
    }
    weeks.push(week);
  }

  if (loading) return <div className="container page"><div className="spinner"></div></div>;

  return (
    <div className="container page">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1>50-Day SAT Calendar</html>
        <p>Each day contains your assigned sections. Click any available day to start.</p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Completed', style: { background: 'var(--cyan)', color: 'white' } },
          { label: 'Today', style: { border: '2px solid var(--cyan)', color: 'var(--cyan-dark)', fontWeight: 700 } },
          { label: 'Available', style: { background: 'white', border: '1.5px solid var(--border)' } },
          { label: 'Upcoming', style: { background: '#f5f5f5', color: '#ccc' } },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, ...item.style, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', border: item.style.border || 'none' }}>1</div>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Week-by-week grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: 10, fontWeight: 600 }}>
              Week {wi + 1} — Days {week[0]}–{week[4]}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {week.map(day => {
                const done    = completedDays.has(day);
                const isToday = day === currentDay;
                const locked  = day > currentDay;

                let cls = 'day-cell';
                if (done)    cls += ' done';
                else if (isToday) cls += ' today';
                else if (locked)  cls += ' locked';

                const inner = (
                  <div key={day} className={cls} title={`Day ${day}`}>
                    {day}
                    {done && <span style={{ fontSize: '0.6rem', display: 'block', lineHeight: 1 }}>✓</span>}
                  </div>
                );

                return locked ? inner : (
                  <Link key={day} to={`/session/${day}`} style={{ textDecoration: 'none' }}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getCurrentDay(startDate) {
  if (!startDate) return 1;
  const start = new Date(startDate);
  const today = new Date();
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diff + 1, 1), 50);
}
