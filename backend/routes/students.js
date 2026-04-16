const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../db');

// PUT /api/students/plan — student selects their plan level (1, 2, or 3)
router.put('/plan', auth, async (req, res) => {
  const { plan_level } = req.body;
  if (![1, 2, 3].includes(plan_level))
    return res.status(400).json({ error: 'plan_level must be 1, 2, or 3.' });

  const { data, error } = await supabase
    .from('users')
    .update({ plan_level, start_date: new Date().toISOString().split('T')[0] })
    .eq('id', req.userId)
    .select('id, plan_level, start_date').single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ user: data });
});

// GET /api/students/progress — get all completed sections for this student
router.get('/progress', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('student_progress')
    .select('*, sections(title, subject, day_number)')
    .eq('user_id', req.userId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ progress: data });
});

// POST /api/students/progress — mark a section complete
router.post('/progress', auth, async (req, res) => {
  const { section_id, score, total } = req.body;

  const { data, error } = await supabase
    .from('student_progress')
    .upsert({
      user_id: req.userId,
      section_id,
      completed: true,
      completed_at: new Date().toISOString(),
      score: score || 0,
      total: total || 0
    }, { onConflict: 'user_id,section_id' })
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ progress: data });
});

// GET /api/students/stats — overview stats for dashboard
router.get('/stats', auth, async (req, res) => {
  const { data: user } = await supabase
    .from('users').select('plan_level, start_date').eq('id', req.userId).single();

  const { count: completedSections } = await supabase
    .from('student_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.userId).eq('completed', true);

  const { count: totalVocab } = await supabase
    .from('vocabulary')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.userId);

  const { count: totalMistakes } = await supabase
    .from('mistake_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.userId);

  // Calculate current day in the 50-day program
  let currentDay = 1;
  if (user?.start_date) {
    const start = new Date(user.start_date);
    const today = new Date();
    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    currentDay = Math.min(Math.max(diff + 1, 1), 50);
  }

  // Total study hours
  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('duration_seconds')
    .eq('user_id', req.userId)
    .not('duration_seconds', 'is', null);

  const totalSeconds = (sessions || []).reduce((sum, s) => sum + s.duration_seconds, 0);

  res.json({
    plan_level: user?.plan_level,
    current_day: currentDay,
    completed_sections: completedSections || 0,
    total_vocab: totalVocab || 0,
    total_mistakes: totalMistakes || 0,
    total_study_hours: Math.round((totalSeconds / 3600) * 10) / 10
  });
});

module.exports = router;
