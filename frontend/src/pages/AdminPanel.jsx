import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const SUBJECTS = ['sat_math', 'sat_english', 'ielts', 'vocab'];
const SUBJECT_LABELS = {
  sat_math: 'SAT Math', sat_english: 'SAT English', ielts: 'IELTS', vocab: 'Vocabulary'
};

export default function AdminPanel() {
  const [tab, setTab] = useState('sections'); // 'sections' | 'questions' | 'import' | 'students'
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // New section form
  const [secForm, setSecForm] = useState({
    title: '', subject: 'sat_math', day_number: 1,
    plan_levels: [1, 2, 3], explanation: '', display_order: 0
  });

  // Selected section for question entry
  const [selectedSec, setSelectedSec] = useState('');
  const [secQuestions, setSecQuestions] = useState([]);
  const [qForm, setQForm] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_answer: 'A', explanation: '', question_type: 'mcq', passage_text: '', display_order: 0
  });

  // Bulk import
  const [importJson, setImportJson] = useState('');
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [s, st] = await Promise.all([api.admin.getSections(), api.admin.getStudents()]);
      setSections(s.sections);
      setStudents(st.students);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function createSection() {
    setMsg(''); setError('');
    try {
      await api.admin.createSection(secForm);
      setMsg('Section created!');
      await load();
      setSecForm({ title: '', subject: 'sat_math', day_number: 1, plan_levels: [1,2,3], explanation: '', display_order: 0 });
    } catch (e) { setError(e.message); }
  }

  async function deleteSection(id) {
    if (!confirm('Delete this section and ALL its questions?')) return;
    try {
      await api.admin.deleteSection(id);
      await load();
      if (selectedSec === id) { setSelectedSec(''); setSecQuestions([]); }
    } catch (e) { setError(e.message); }
  }

  async function loadQuestions(secId) {
    setSelectedSec(secId);
    try {
      const d = await api.admin.getQuestions(secId);
      setSecQuestions(d.questions);
    } catch (e) { setError(e.message); }
  }

  async function addQuestion() {
    if (!selectedSec) return;
    setMsg(''); setError('');
    try {
      const q = { ...qForm, section_id: selectedSec };
      await api.admin.createQuestions([q]);
      setMsg('Question added!');
      await loadQuestions(selectedSec);
      setQForm({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
        correct_answer: 'A', explanation: '', question_type: 'mcq', passage_text: '', display_order: secQuestions.length });
    } catch (e) { setError(e.message); }
  }

  async function deleteQuestion(id) {
    try {
      await api.admin.deleteQuestion(id);
      setSecQuestions(q => q.filter(x => x.id !== id));
    } catch (e) { setError(e.message); }
  }

  async function runImport() {
    setMsg(''); setError(''); setImportResult(null);
    try {
      const body = JSON.parse(importJson);
      const result = await api.admin.import(body);
      setImportResult(result);
      setImportJson('');
      await load();
    } catch (e) { setError(e.message || 'Invalid JSON'); }
  }

  function togglePlan(n) {
    setSecForm(f => ({
      ...f,
      plan_levels: f.plan_levels.includes(n)
        ? f.plan_levels.filter(p => p !== n)
        : [...f.plan_levels, n].sort()
    }));
  }

  if (loading) return <div className="container page"><div className="spinner"></div></div>;

  const TABS = ['sections', 'questions', 'import', 'students'];

  return (
    <div className="container page">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Admin Panel</h1>
        <p>Manage content, questions, and students for the Stoic Edu platform.</p>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', border: 'none', borderBottom: tab === t ? '2px solid var(--cyan)' : '2px solid transparent',
            background: 'transparent', cursor: 'pointer', fontWeight: tab === t ? 600 : 400,
            color: tab === t ? 'var(--cyan-dark)' : 'var(--text-2)', textTransform: 'capitalize', fontSize: '0.95rem',
          }}>{t}</button>
        ))}
      </div>

      {/* ── SECTIONS TAB ── */}
      {tab === 'sections' && (
        <div>
          <div className="card card-lg" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Create new section</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Section title</label>
                <input className="input" value={secForm.title}
                  onChange={e => setSecForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. SAT Reading — Passage Analysis" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Subject</label>
                <select className="select" value={secForm.subject}
                  onChange={e => setSecForm(f => ({ ...f, subject: e.target.value }))}>
                  {SUBJECTS.map(s => <option key={s} value={s}>{SUBJECT_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Day number (1–50)</label>
                <input className="input" type="number" min={1} max={50}
                  value={secForm.day_number}
                  onChange={e => setSecForm(f => ({ ...f, day_number: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 10 }}>
              <label>Plan levels (which students see this?)</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[1,2,3].map(n => (
                  <label key={n} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 400, color: 'var(--text)' }}>
                    <input type="checkbox" checked={secForm.plan_levels.includes(n)}
                      onChange={() => togglePlan(n)} />
                    Level {n}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Overview explanation (shown to students before questions)</label>
              <textarea className="textarea" value={secForm.explanation}
                onChange={e => setSecForm(f => ({ ...f, explanation: e.target.value }))}
                placeholder="Write a brief explanation of what this section covers and any important context..." />
            </div>
            <button className="btn btn-primary" onClick={createSection}>Create section</button>
          </div>

          {/* List of existing sections */}
          <h3 style={{ marginBottom: 10 }}>All sections ({sections.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sections.map(s => (
              <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600 }}>{s.title}</span>
                    <span className="badge badge-cyan">Day {s.day_number}</span>
                    <span className="badge" style={{ background: '#f0f0f0', color: '#666' }}>
                      {SUBJECT_LABELS[s.subject] || s.subject}
                    </span>
                    <span className="badge badge-gray">Levels {s.plan_levels.join(',')}</span>
                  </div>
                  {s.explanation && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 4 }}>
                      {s.explanation.slice(0, 80)}{s.explanation.length > 80 ? '…' : ''}
                    </p>
                  )}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => { setTab('questions'); loadQuestions(s.id); }}>
                  Add questions
                </button>
                <button className="btn btn-sm" style={{ background: '#FDEAEA', color: 'var(--danger)', border: 'none' }}
                  onClick={() => deleteSection(s.id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── QUESTIONS TAB ── */}
      {tab === 'questions' && (
        <div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Select section to add questions to</label>
            <select className="select" value={selectedSec}
              onChange={e => loadQuestions(e.target.value)}>
              <option value="">— Choose a section —</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>Day {s.day_number} — {s.title}</option>
              ))}
            </select>
          </div>

          {selectedSec && (
            <>
              {/* Add question form */}
              <div className="card card-lg" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Add question</h3>

                <div className="form-group">
                  <label>Question type</label>
                  <select className="select" value={qForm.question_type}
                    onChange={e => setQForm(f => ({ ...f, question_type: e.target.value }))}>
                    <option value="mcq">Multiple choice (A/B/C/D)</option>
                    <option value="short_answer">Short answer (typed)</option>
                    <option value="passage">Passage-based multiple choice</option>
                  </select>
                </div>

                {(qForm.question_type === 'passage') && (
                  <div className="form-group">
                    <label>Passage text (paste your reading passage here)</label>
                    <textarea className="textarea" style={{ minHeight: 140 }}
                      value={qForm.passage_text}
                      onChange={e => setQForm(f => ({ ...f, passage_text: e.target.value }))}
                      placeholder="Paste the reading passage here. All questions below will reference this passage." />
                  </div>
                )}

                <div className="form-group">
                  <label>Question text</label>
                  <textarea className="textarea" value={qForm.question_text}
                    onChange={e => setQForm(f => ({ ...f, question_text: e.target.value }))}
                    placeholder="Write your question here..." />
                </div>

                {qForm.question_type !== 'short_answer' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {['a','b','c','d'].map(letter => (
                      <div key={letter} className="form-group" style={{ margin: 0 }}>
                        <label>Option {letter.toUpperCase()}</label>
                        <input className="input" value={qForm[`option_${letter}`]}
                          onChange={e => setQForm(f => ({ ...f, [`option_${letter}`]: e.target.value }))}
                          placeholder={`Option ${letter.toUpperCase()}`} />
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 10 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Correct answer</label>
                    {qForm.question_type === 'short_answer' ? (
                      <input className="input" value={qForm.correct_answer}
                        onChange={e => setQForm(f => ({ ...f, correct_answer: e.target.value }))}
                        placeholder="Exact correct answer" />
                    ) : (
                      <select className="select" value={qForm.correct_answer}
                        onChange={e => setQForm(f => ({ ...f, correct_answer: e.target.value }))}>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    )}
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Answer explanation (shown after student answers)</label>
                    <input className="input" value={qForm.explanation}
                      onChange={e => setQForm(f => ({ ...f, explanation: e.target.value }))}
                      placeholder="Explain why this is the correct answer..." />
                  </div>
                </div>

                <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={addQuestion}>
                  Add question
                </button>
              </div>

              {/* Existing questions */}
              <h3 style={{ marginBottom: 10 }}>Questions in this section ({secQuestions.length})</h3>
              {secQuestions.length === 0 ? (
                <div className="empty"><p>No questions yet. Add some above.</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {secQuestions.map((q, i) => (
                    <div key={q.id} className="card" style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
                            <span style={{ color: 'var(--text-3)', marginRight: 6 }}>Q{i+1}.</span>
                            {q.question_text.slice(0, 120)}{q.question_text.length > 120 ? '…' : ''}
                          </p>
                          <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>
                            Correct: {q.correct_answer}
                          </span>
                        </div>
                        <button className="btn btn-sm" style={{ background: '#FDEAEA', color: 'var(--danger)', border: 'none', flexShrink: 0 }}
                          onClick={() => deleteQuestion(q.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── IMPORT TAB ── */}
      {tab === 'import' && (
        <div>
          <div className="card card-lg" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: 8 }}>Bulk import (paste JSON)</h3>
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
              Paste a full day's content as JSON. This is the fastest way to add many sections and questions at once.
            </p>

            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              <strong>Format:</strong><br />
              <code style={{ fontSize: '0.8rem', display: 'block', marginTop: 6, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{JSON.stringify({
  "day_number": 1,
  "plan_levels": [1, 2, 3],
  "sections": [
    {
      "title": "SAT Math — Linear Equations",
      "subject": "sat_math",
      "explanation": "Today we review solving linear equations...",
      "questions": [
        {
          "question_text": "Solve: 2x + 4 = 12",
          "option_a": "x = 3",
          "option_b": "x = 4",
          "option_c": "x = 6",
          "option_d": "x = 8",
          "correct_answer": "B",
          "explanation": "2x = 8, so x = 4",
          "question_type": "mcq"
        }
      ]
    }
  ]
}, null, 2)}</code>
            </div>

            <textarea className="textarea" style={{ minHeight: 300, fontFamily: 'monospace', fontSize: '0.85rem' }}
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              placeholder="Paste your JSON here..." />
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={runImport}>
              Import content
            </button>
          </div>

          {importResult && (
            <div className="alert alert-success">
              <strong>Imported successfully!</strong><br />
              {importResult.imported.map((r, i) => (
                <div key={i} style={{ marginTop: 4 }}>✓ {r.section} — {r.questions} questions</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STUDENTS TAB ── */}
      {tab === 'students' && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Registered students ({students.length})</h3>
          {students.length === 0 ? (
            <div className="empty"><p>No students registered yet.</p></div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'var(--off-white)', borderBottom: '1px solid var(--border)' }}>
                    {['Name', 'Email', 'Plan', 'Start date', 'Registered'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-2)', fontSize: '0.8rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: i < students.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 500 }}>{s.full_name}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-2)' }}>{s.email}</td>
                      <td style={{ padding: '10px 16px' }}>
                        {s.plan_level ? (
                          <span className={`badge ${s.plan_level === 1 ? 'badge-red' : s.plan_level === 2 ? 'badge-orange' : 'badge-green'}`}>
                            Level {s.plan_level}
                          </span>
                        ) : <span className="badge badge-gray">Not set</span>}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-3)', fontSize: '0.85rem' }}>
                        {s.start_date || '—'}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-3)', fontSize: '0.85rem' }}>
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
