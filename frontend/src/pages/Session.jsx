import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

const SUBJECT_LABELS = {
  sat_math:    'SAT Math',
  sat_english: 'SAT English',
  ielts:       'IELTS',
  vocab:       'Vocabulary',
};
const SUBJECT_COLORS = {
  sat_math:    'var(--cyan)',
  sat_english: 'var(--warning)',
  ielts:       'var(--danger)',
  vocab:       'var(--success)',
};

export default function Session() {
  const { day } = useParams();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSec, setActiveSec] = useState(0);
  const [answers, setAnswers] = useState({});       // questionId -> { answer, result }
  const [mistakes, setMistakes] = useState({});     // questionId -> reflection text
  const [vocab, setVocab] = useState({ word: '', definition: '' });
  const [vocabAdded, setVocabAdded] = useState([]);
  const [sectionDone, setSectionDone] = useState({});

  // Study timer
  const sessionId = useRef(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    api.dayContent(day)
      .then(d => setSections(d.sections || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    // Start study session timer
    api.startSession()
      .then(d => { sessionId.current = d.session.id; })
      .catch(() => {});

    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => {
      clearInterval(timer);
      if (sessionId.current) {
        api.endSession(sessionId.current).catch(() => {});
      }
    };
  }, [day]);

  async function submitAnswer(questionId, answer) {
    try {
      const result = await api.answer(questionId, answer);
      setAnswers(a => ({ ...a, [questionId]: { answer, result } }));
    } catch (e) {
      console.error(e);
    }
  }

  async function saveMistake(questionId) {
    const reflection = mistakes[questionId];
    if (!reflection?.trim()) return;
    try {
      await api.addMistake({ question_id: questionId, reflection });
    } catch (e) {
      console.error(e);
    }
  }

  async function addVocabWord() {
    if (!vocab.word.trim()) return;
    try {
      const cur = sections[activeSec];
      await api.addVocab({
        word: vocab.word.trim(),
        definition: vocab.definition.trim(),
        source_section_id: cur?.id
      });
      setVocabAdded(v => [...v, vocab.word.trim()]);
      setVocab({ word: '', definition: '' });
    } catch (e) {
      console.error(e);
    }
  }

  async function markSectionComplete(secId, secIndex) {
    const secQuestions = sections[secIndex]?.questions || [];
    const correct = secQuestions.filter(q => answers[q.id]?.result?.is_correct).length;
    try {
      await api.markDone({ section_id: secId, score: correct, total: secQuestions.length });
      setSectionDone(d => ({ ...d, [secId]: true }));
    } catch (e) {
      console.error(e);
    }
  }

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  if (loading) return <div className="container page"><div className="spinner"></div></div>;
  if (error) return <div className="container page"><div className="alert alert-error">{error}</div></div>;
  if (sections.length === 0) return (
    <div className="container page">
      <div className="empty">
        <div className="empty-icon">📭</div>
        <h2>No content yet for Day {day}</h2>
        <p>Your teacher hasn't added content for this day yet. Check back soon.</p>
        <Link to="/calendar" className="btn btn-outline" style={{ marginTop: 16 }}>Back to calendar</Link>
      </div>
    </div>
  );

  const sec = sections[activeSec];

  return (
    <div className="container page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <Link to="/calendar" style={{ color: 'var(--text-3)', fontSize: '0.875rem', textDecoration: 'none' }}>
            ← Calendar
          </Link>
          <h1 style={{ marginTop: 4 }}>Day {day}</h1>
        </div>
        {/* Study timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--cyan-pale)', padding: '8px 16px', borderRadius: 30 }}>
          <span className="live-dot"></span>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--cyan-dark)' }}>
            {fmt(elapsed)}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>studying</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Section sidebar */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div className="card" style={{ padding: '0.75rem' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 8, fontWeight: 600, paddingLeft: 4 }}>SECTIONS</p>
            {sections.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveSec(i)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 10px', borderRadius: 8, border: 'none',
                  background: activeSec === i ? 'var(--cyan-pale)' : 'transparent',
                  color: activeSec === i ? 'var(--cyan-dark)' : 'var(--text-2)',
                  cursor: 'pointer', fontSize: '0.875rem', marginBottom: 2,
                  fontWeight: activeSec === i ? 600 : 400,
                  borderLeft: activeSec === i ? `3px solid var(--cyan)` : '3px solid transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{s.title}</span>
                  {sectionDone[s.id] && <span style={{ color: 'var(--success)', fontSize: '0.75rem' }}>✓</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: SUBJECT_COLORS[s.subject] || 'var(--text-3)', marginTop: 2 }}>
                  {SUBJECT_LABELS[s.subject] || s.subject}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div>
          {/* Section header */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: sec.explanation ? 10 : 0 }}>
              <span className="badge" style={{
                background: (SUBJECT_COLORS[sec.subject] || 'var(--cyan)') + '22',
                color: SUBJECT_COLORS[sec.subject] || 'var(--cyan-dark)'
              }}>
                {SUBJECT_LABELS[sec.subject] || sec.subject}
              </span>
              <h2 style={{ margin: 0 }}>{sec.title}</h2>
            </div>
            {sec.explanation && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-2)', marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                {sec.explanation}
              </p>
            )}
          </div>

          {/* Questions */}
          {(sec.questions || []).length === 0 ? (
            <div className="card">
              <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '1rem 0' }}>
                No questions added for this section yet.
              </p>
            </div>
          ) : (
            (sec.questions || []).map((q, qi) => {
              const attempt = answers[q.id];
              const answered = !!attempt;

              return (
                <div key={q.id} className="card question-card">
                  {/* Passage */}
                  {q.passage_text && (
                    <div style={{
                      background: 'var(--off-white)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '12px 16px', marginBottom: 14,
                      fontSize: '0.9rem', color: 'var(--text-2)', lineHeight: 1.7,
                      maxHeight: 220, overflowY: 'auto'
                    }}>
                      {q.passage_text}
                    </div>
                  )}

                  <div className="question-text">
                    <span style={{ color: 'var(--text-3)', marginRight: 8, fontSize: '0.85rem' }}>Q{qi + 1}.</span>
                    {q.question_text}
                  </div>

                  {/* MCQ options */}
                  {q.question_type !== 'short_answer' && [
                    ['A', q.option_a], ['B', q.option_b],
                    ['C', q.option_c], ['D', q.option_d]
                  ].filter(([, text]) => text).map(([letter, text]) => {
                    let cls = 'option-btn';
                    if (answered) {
                      if (letter === attempt.result.correct_answer) cls += ' correct';
                      else if (letter === attempt.answer && !attempt.result.is_correct) cls += ' wrong';
                    }
                    return (
                      <button key={letter} className={cls}
                        disabled={answered}
                        onClick={() => submitAnswer(q.id, letter)}>
                        <strong style={{ marginRight: 8 }}>{letter}.</strong> {text}
                      </button>
                    );
                  })}

                  {/* Short answer */}
                  {q.question_type === 'short_answer' && !answered && (
                    <ShortAnswerInput onSubmit={ans => submitAnswer(q.id, ans)} />
                  )}

                  {/* Result + explanation */}
                  {answered && (
                    <>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        marginTop: 10, marginBottom: attempt.result.is_correct ? 0 : 10
                      }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600,
                          background: attempt.result.is_correct ? '#E6F6EF' : '#FDEAEA',
                          color: attempt.result.is_correct ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {attempt.result.is_correct ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                      {attempt.result.explanation && (
                        <div className="explanation-box">{attempt.result.explanation}</div>
                      )}

                      {/* Mistake logger — shown only on wrong answers */}
                      {!attempt.result.is_correct && (
                        <div style={{ marginTop: 12, padding: 12, background: '#FFF8F5', borderRadius: 8, border: '1px solid #FDDBC8' }}>
                          <label style={{ color: 'var(--warning)', marginBottom: 6 }}>
                            Why did you get this wrong? (one sentence — optional)
                          </label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              className="input"
                              placeholder="e.g. I confused the meaning of 'imply' vs 'infer'"
                              value={mistakes[q.id] || ''}
                              onChange={e => setMistakes(m => ({ ...m, [q.id]: e.target.value }))}
                            />
                            <button className="btn btn-ghost btn-sm" onClick={() => saveMistake(q.id)}>
                              Save
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: 'transparent', color: 'var(--text-3)', border: 'none' }}
                              onClick={() => setMistakes(m => ({ ...m, [q.id]: '__skip__' }))}
                            >
                              Skip
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}

          {/* Vocabulary capture box */}
          <div className="card" style={{ marginBottom: '1rem', border: '1px dashed var(--cyan-light)' }}>
            <h3 style={{ marginBottom: 10, color: 'var(--cyan-dark)' }}>📖 Add to vocabulary</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: 12 }}>
              Found an unknown word? Look it up in your dictionary and save it here.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="input" style={{ flex: 1, minWidth: 120 }}
                placeholder="Word"
                value={vocab.word}
                onChange={e => setVocab(v => ({ ...v, word: e.target.value }))} />
              <input className="input" style={{ flex: 2, minWidth: 200 }}
                placeholder="Meaning (from your dictionary)"
                value={vocab.definition}
                onChange={e => setVocab(v => ({ ...v, definition: e.target.value }))} />
              <button className="btn btn-primary" onClick={addVocabWord}>Add</button>
            </div>
            {vocabAdded.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {vocabAdded.map((w, i) => (
                  <span key={i} className="badge badge-green" style={{ marginRight: 6 }}>✓ {w}</span>
                ))}
              </div>
            )}
          </div>

          {/* Mark section complete */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-end' }}>
            {activeSec < sections.length - 1 && (
              <button className="btn btn-outline" onClick={() => {
                markSectionComplete(sec.id, activeSec);
                setActiveSec(a => a + 1);
                window.scrollTo(0, 0);
              }}>
                {sectionDone[sec.id] ? 'Next section →' : 'Complete & next →'}
              </button>
            )}
            {activeSec === sections.length - 1 && (
              <button
                className="btn btn-primary"
                onClick={() => markSectionComplete(sec.id, activeSec)}
                disabled={sectionDone[sec.id]}
              >
                {sectionDone[sec.id] ? '✓ Day complete!' : 'Complete day'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShortAnswerInput({ onSubmit }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input className="input" value={val} onChange={e => setVal(e.target.value)}
        placeholder="Your answer" onKeyDown={e => e.key === 'Enter' && val.trim() && onSubmit(val.trim())} />
      <button className="btn btn-primary btn-sm" onClick={() => val.trim() && onSubmit(val.trim())}>
        Submit
      </button>
    </div>
  );
}
