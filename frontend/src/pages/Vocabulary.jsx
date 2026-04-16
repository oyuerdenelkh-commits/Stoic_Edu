import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Vocabulary() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ word: '', definition: '', example_sentence: '' });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getVocab()
      .then(d => setEntries(d.vocabulary))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function add() {
    if (!form.word.trim()) return;
    try {
      const d = await api.addVocab(form);
      setEntries(e => [d.entry, ...e]);
      setForm({ word: '', definition: '', example_sentence: '' });
    } catch (e) { console.error(e); }
  }

  async function saveEdit(id) {
    try {
      const d = await api.updateVocab(id, editForm);
      setEntries(e => e.map(v => v.id === id ? d.entry : v));
      setEditId(null);
    } catch (e) { console.error(e); }
  }

  async function remove(id) {
    if (!confirm('Delete this word?')) return;
    try {
      await api.deleteVocab(id);
      setEntries(e => e.filter(v => v.id !== id));
    } catch (e) { console.error(e); }
  }

  const filtered = entries.filter(e =>
    e.word.toLowerCase().includes(search.toLowerCase()) ||
    (e.definition || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="container page"><div className="spinner"></div></div>;

  return (
    <div className="container page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Vocabulary Notepad</h1>
          <p>{entries.length} words saved</p>
        </div>
      </div>

      {/* Add new word */}
      <div className="card card-lg" style={{ marginBottom: '1.5rem', border: '1px dashed var(--cyan-light)' }}>
        <h3 style={{ color: 'var(--cyan-dark)', marginBottom: 12 }}>Add a new word</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 10 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Word</label>
            <input className="input" value={form.word}
              onChange={e => setForm(f => ({ ...f, word: e.target.value }))}
              placeholder="e.g. ambiguous" />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Meaning (from your dictionary)</label>
            <input className="input" value={form.definition}
              onChange={e => setForm(f => ({ ...f, definition: e.target.value }))}
              placeholder="Open your dictionary and write the meaning here" />
          </div>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Example sentence (optional)</label>
          <input className="input" value={form.example_sentence}
            onChange={e => setForm(f => ({ ...f, example_sentence: e.target.value }))}
            placeholder="Write a sentence using this word" />
        </div>
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={add}>
          Add word
        </button>
      </div>

      {/* Search */}
      <input
        className="input" style={{ marginBottom: '1rem' }}
        placeholder="Search your vocabulary..."
        value={search} onChange={e => setSearch(e.target.value)}
      />

      {/* Entries */}
      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📖</div>
          <p>{search ? 'No words match your search.' : 'Add your first word above. Look it up in your dictionary and save it here!'}</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.map((entry, i) => (
            <div key={entry.id} style={{
              padding: '14px 20px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              {editId === entry.id ? (
                <div>
                  <input className="input" style={{ marginBottom: 8 }}
                    value={editForm.definition || ''}
                    onChange={e => setEditForm(f => ({ ...f, definition: e.target.value }))}
                    placeholder="Meaning" />
                  <input className="input" style={{ marginBottom: 10 }}
                    value={editForm.example_sentence || ''}
                    onChange={e => setEditForm(f => ({ ...f, example_sentence: e.target.value }))}
                    placeholder="Example sentence" />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => saveEdit(entry.id)}>Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span className="vocab-word">{entry.word}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {entry.definition && <div className="vocab-def">{entry.definition}</div>}
                    {entry.example_sentence && (
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-3)', marginTop: 4, fontStyle: 'italic' }}>
                        "{entry.example_sentence}"
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                      setEditId(entry.id);
                      setEditForm({ definition: entry.definition, example_sentence: entry.example_sentence });
                    }}>Edit</button>
                    <button className="btn btn-sm" style={{
                      background: 'transparent', color: 'var(--text-3)', border: '1px solid var(--border)'
                    }} onClick={() => remove(entry.id)}>✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
