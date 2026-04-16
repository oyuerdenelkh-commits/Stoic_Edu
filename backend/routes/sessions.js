const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../db');

// POST /api/sessions/start — start a study session
router.post('/start', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({ user_id: req.userId })
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ session: data });
});

// POST /api/sessions/:id/end — end a session
router.post('/:id/end', auth, async (req, res) => {
  const { data: session } = await supabase
    .from('study_sessions').select('started_at').eq('id', req.params.id).single();

  if (!session) return res.status(404).json({ error: 'Session not found.' });

  const duration_seconds = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);

  const { data, error } = await supabase
    .from('study_sessions')
    .update({ ended_at: new Date().toISOString(), duration_seconds })
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ session: data });
});

// GET /api/sessions/totals — total hours by date for this student
router.get('/totals', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('date, duration_seconds')
    .eq('user_id', req.userId)
    .not('duration_seconds', 'is', null)
    .order('date', { ascending: false })
    .limit(60);

  if (error) return res.status(500).json({ error: error.message });

  // Aggregate by date
  const byDate = {};
  for (const s of data) {
    byDate[s.date] = (byDate[s.date] || 0) + s.duration_seconds;
  }

  res.json({
    totals: Object.entries(byDate).map(([date, seconds]) => ({
      date,
      hours: Math.round((seconds / 3600) * 10) / 10
    }))
  });
});

module.exports = router;
