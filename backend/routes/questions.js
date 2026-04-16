const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../db');

// GET /api/questions/day/:dayNumber — get all sections+questions for a day
// Filters by student's plan_level automatically
router.get('/day/:dayNumber', auth, async (req, res) => {
  const { data: user } = await supabase
    .from('users').select('plan_level').eq('id', req.userId).single();

  if (!user?.plan_level)
    return res.status(400).json({ error: 'Student has not selected a plan yet.' });

  const { data: sections, error } = await supabase
    .from('sections')
    .select('*, questions(*)') 
    .eq('day_number', parseInt(req.params.dayNumber))
    .contains('plan_levels', [user.plan_level])
    .order('display_order');

  if (error) return res.status(500).json({ error: error.message });

  // Sort questions within each section
  const sectionsWithSortedQ = (sections || []).map(s => ({
    ...s,
    questions: (s.questions || []).sort((a, b) => a.display_order - b.display_order)
  }));

  res.json({ sections: sectionsWithSortedQ, day: parseInt(req.params.dayNumber) });
});

// POST /api/questions/:id/answer — submit an answer
router.post('/:id/answer', auth, async (req, res) => {
  const { answer } = req.body;

  // Get the correct answer
  const { data: question } = await supabase
    .from('questions').select('correct_answer, explanation').eq('id', req.params.id).single();

  if (!question) return res.status(404).json({ error: 'Question not found.' });

  const is_correct = answer?.trim().toUpperCase() === question.correct_answer?.trim().toUpperCase();

  // Record the attempt
  await supabase.from('question_attempts').insert({
    user_id: req.userId,
    question_id: req.params.id,
    answer_given: answer,
    is_correct
  });

  res.json({
    is_correct,
    correct_answer: question.correct_answer,
    explanation: question.explanation
  });
});

module.exports = router;
