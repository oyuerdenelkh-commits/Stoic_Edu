const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../db');

// GET /api/mistakes — get all mistake reflections for this student
router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('mistake_logs')
    .select('*, questions(question_text, correct_answer, explanation, sections(title, subject))')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ mistakes: data });
});

// POST /api/mistakes — log a mistake reflection
// Called after a student gets a question wrong and writes their reflection
router.post('/', auth, async (req, res) => {
  const { question_id, reflection } = req.body;
  if (!question_id) return res.status(400).json({ error: 'question_id required.' });

  const { data, error } = await supabase
    .from('mistake_logs')
    .upsert({ user_id: req.userId, question_id, reflection }, { onConflict: 'user_id,question_id' })
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ log: data });
});

module.exports = router;
