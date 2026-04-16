const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../db');

// GET /api/vocabulary — get all vocab for this student
router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ vocabulary: data });
});

// POST /api/vocabulary — add a word
router.post('/', auth, async (req, res) => {
  const { word, definition, example_sentence, source_section_id } = req.body;
  if (!word) return res.status(400).json({ error: 'Word is required.' });

  const { data, error } = await supabase
    .from('vocabulary')
    .insert({ user_id: req.userId, word, definition, example_sentence, source_section_id })
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ entry: data });
});

// PUT /api/vocabulary/:id — update definition or example
router.put('/:id', auth, async (req, res) => {
  const { definition, example_sentence } = req.body;

  const { data, error } = await supabase
    .from('vocabulary')
    .update({ definition, example_sentence })
    .eq('id', req.params.id)
    .eq('user_id', req.userId) // security: can only edit own words
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ entry: data });
});

// DELETE /api/vocabulary/:id
router.delete('/:id', auth, async (req, res) => {
  const { error } = await supabase
    .from('vocabulary')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
