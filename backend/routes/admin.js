const router = require('express').Router();
const adminOnly = require('../middleware/adminOnly');
const supabase = require('../db');

// ─── CREATE A SECTION (lesson container) ─────────────────────────────────────
// POST /api/admin/sections
// Body: { title, subject, day_number, plan_levels, explanation }
// subject: 'sat_math' | 'sat_english' | 'ielts' | 'vocab'
// plan_levels: [1, 2, 3] or [1, 2] or [1] etc.
router.post('/sections', adminOnly, async (req, res) => {
  const { title, subject, day_number, plan_levels, explanation, display_order } = req.body;
  if (!title || !subject || !day_number || !plan_levels)
    return res.status(400).json({ error: 'title, subject, day_number, plan_levels required.' });

  const { data, error } = await supabase
    .from('sections')
    .insert({ title, subject, day_number, plan_levels, explanation, display_order: display_order || 0 })
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ section: data });
});

// GET /api/admin/sections — list all sections (for admin to see what's been added)
router.get('/sections', adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .order('day_number', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ sections: data });
});

// UPDATE a section
router.put('/sections/:id', adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('sections')
    .update(req.body)
    .eq('id', req.params.id)
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ section: data });
});

// DELETE a section (cascades to questions)
router.delete('/sections/:id', adminOnly, async (req, res) => {
  const { error } = await supabase.from('sections').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ─── CREATE QUESTIONS ─────────────────────────────────────────────────────────
// POST /api/admin/questions
// You can paste one question or an array of questions
router.post('/questions', adminOnly, async (req, res) => {
  let questions = req.body;
  // Accept single question or array
  if (!Array.isArray(questions)) questions = [questions];

  const { data, error } = await supabase
    .from('questions')
    .insert(questions)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ questions: data, count: data.length });
});

// UPDATE a question
router.put('/questions/:id', adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('questions')
    .update(req.body)
    .eq('id', req.params.id)
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ question: data });
});

// DELETE a question
router.delete('/questions/:id', adminOnly, async (req, res) => {
  const { error } = await supabase.from('questions').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// GET all questions for a section
router.get('/sections/:sectionId/questions', adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('section_id', req.params.sectionId)
    .order('display_order');

  if (error) return res.status(500).json({ error: error.message });
  res.json({ questions: data });
});

// ─── BULK IMPORT via pasted JSON ──────────────────────────────────────────────
// POST /api/admin/import
// Paste a day's worth of content as JSON
// { day_number, plan_levels, sections: [{ title, subject, explanation, questions: [...] }] }
router.post('/import', adminOnly, async (req, res) => {
  const { day_number, plan_levels, sections } = req.body;
  if (!day_number || !sections)
    return res.status(400).json({ error: 'day_number and sections required.' });

  const results = [];

  for (const s of sections) {
    const { data: sec, error: secErr } = await supabase
      .from('sections')
      .insert({
        title: s.title,
        subject: s.subject,
        day_number,
        plan_levels: plan_levels || [1, 2, 3],
        explanation: s.explanation || null,
        display_order: s.display_order || 0
      })
      .select().single();

    if (secErr) return res.status(500).json({ error: secErr.message, at: s.title });

    if (s.questions && s.questions.length > 0) {
      const qs = s.questions.map((q, i) => ({
        ...q,
        section_id: sec.id,
        display_order: q.display_order || i
      }));
      const { data: qData, error: qErr } = await supabase.from('questions').insert(qs).select();
      if (qErr) return res.status(500).json({ error: qErr.message, at: s.title + ' questions' });
      results.push({ section: sec.title, questions: qData.length });
    } else {
      results.push({ section: sec.title, questions: 0 });
    }
  }

  res.json({ ok: true, imported: results });
});

// ─── STUDENT OVERVIEW (admin can see all students) ───────────────────────────
router.get('/students', adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, plan_level, start_date, created_at')
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ students: data });
});

module.exports = router;
