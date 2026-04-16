const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password || !full_name)
    return res.status(400).json({ error: 'All fields are required.' });

  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  // Check if email already exists
  const { data: existing } = await supabase
    .from('users').select('id').eq('email', email).single();
  if (existing) return res.status(409).json({ error: 'Email already registered.' });

  const password_hash = await bcrypt.hash(password, 12);

  // Check if this email is in the admin list
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
  const role = adminEmails.includes(email) ? 'admin' : 'student';

  const { data: user, error } = await supabase
    .from('users')
    .insert({ email, password_hash, full_name, role })
    .select('id, email, full_name, role, plan_level, start_date')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data: user } = await supabase
    .from('users')
    .select('id, email, full_name, role, plan_level, start_date, password_hash')
    .eq('email', email)
    .single();

  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

  const { password_hash, ...safeUser } = user;
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: safeUser });
});

// GET /api/auth/me — verify token and return user
router.get('/me', require('../middleware/auth'), async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('id, email, full_name, role, plan_level, start_date')
    .eq('id', req.userId)
    .single();
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user });
});

module.exports = router;
