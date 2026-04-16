-- Stoic Edu Database Schema
-- Run this in your Supabase SQL editor

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student', -- 'student' or 'admin'
  plan_level INTEGER DEFAULT NULL,      -- 1, 2, or 3 (set after onboarding)
  start_date DATE DEFAULT NULL,         -- when they started the 50-day program
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sections (your lesson content containers)
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,               -- 'sat_math', 'sat_english', 'ielts', 'vocab'
  day_number INTEGER NOT NULL,         -- which of the 50 days this belongs to
  plan_levels INTEGER[] NOT NULL,      -- e.g. {1,2,3} or {1} for intensive only
  explanation TEXT,                    -- your overview explanation for students
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions (you paste these in via admin panel)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT NOT NULL,        -- 'A', 'B', 'C', 'D', or free text
  explanation TEXT,                    -- answer explanation shown after attempt
  question_type TEXT DEFAULT 'mcq',   -- 'mcq', 'short_answer', 'passage'
  passage_text TEXT,                   -- for reading comprehension questions
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student progress per section
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  score INTEGER,                       -- number correct
  total INTEGER,                       -- total questions
  UNIQUE(user_id, section_id)
);

-- Question attempts (each answer a student gives)
CREATE TABLE question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer_given TEXT,
  is_correct BOOLEAN,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mistake logs (student reflects on why they got it wrong)
CREATE TABLE mistake_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  reflection TEXT,                     -- "why I got this wrong" in one sentence
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Vocabulary notepad
CREATE TABLE vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT,                     -- student writes this from their dictionary
  example_sentence TEXT,
  source_section_id UUID REFERENCES sections(id),  -- where they encountered it
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study sessions (for the live study hours page)
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,            -- filled when session ends
  date DATE DEFAULT CURRENT_DATE
);

-- Indexes for performance
CREATE INDEX idx_sections_day ON sections(day_number);
CREATE INDEX idx_student_progress_user ON student_progress(user_id);
CREATE INDEX idx_question_attempts_user ON question_attempts(user_id);
CREATE INDEX idx_vocab_user ON vocabulary(user_id);
CREATE INDEX idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_date ON study_sessions(date);
