# Stoic Edu — SAT & IELTS Prep Platform

A full-stack web platform for teaching SAT and IELTS to international students.
Built with React, Node.js, and Supabase (PostgreSQL).

---

## Features

- Student self-registration with email + password
- 3 plan levels: Intensive / Mid-Level / Light
- 50-day SAT calendar with daily task sections
- Question practice (MCQ, short answer, passage-based)
- Mistake logger with reflection field
- Vocabulary notepad (Notion-style widget on dashboard)
- Live study room (see classmates studying, track hours)
- Admin panel to add content by copy-paste or JSON import

---

## Tech Stack

| Layer    | Tech                    | Free hosting        |
|----------|-------------------------|---------------------|
| Frontend | React + Vite            | Vercel              |
| Backend  | Node.js + Express       | Railway / Render    |
| Database | PostgreSQL via Supabase | Supabase free tier  |
| Realtime | Socket.io               | Same as backend     |

---

## Setup Instructions

### Step 1 — Set up the database (Supabase)

1. Go to https://supabase.com and create a free account
2. Create a new project (pick any region, remember the database password)
3. Go to **SQL Editor** in the Supabase dashboard
4. Open `supabase/schema.sql` from this project and paste it in, then click **Run**
5. Go to **Settings → API** and copy:
   - Project URL (`SUPABASE_URL`)
   - `service_role` secret key (`SUPABASE_SERVICE_KEY`) — NOT the anon key

### Step 2 — Set up the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=4000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...  (service_role key from Supabase)
JWT_SECRET=some-very-long-random-string-you-make-up
ADMIN_EMAILS=youremail@gmail.com
```

> **ADMIN_EMAILS**: Your email address here. When you register with this email on the site,
> you will automatically get admin access to the Admin Panel.

Run locally:
```bash
npm run dev
```

### Step 3 — Set up the frontend

```bash
cd frontend
npm install
```

For local development, the Vite proxy will forward `/api` to `http://localhost:4000`.
No `.env` needed for local dev.

For production, create `frontend/.env`:
```
VITE_API_URL=https://your-backend-url.railway.app/api
```

Run locally:
```bash
npm run dev
```

---

## Deployment (Free)

### Deploy backend to Railway

1. Go to https://railway.app and sign up (free)
2. Click **New Project → Deploy from GitHub repo**
3. Select your repo, choose the `backend/` folder as root
4. Add your environment variables (same as `.env` above)
5. Railway will give you a URL like `https://stoic-edu-backend.up.railway.app`

### Deploy frontend to Vercel

1. Go to https://vercel.com and sign up (free)
2. Click **New Project → Import from GitHub**
3. Select your repo, set root directory to `frontend/`
4. Add environment variable:
   - `VITE_API_URL` = `https://your-railway-url.up.railway.app/api`
5. Deploy — Vercel gives you a URL like `https://stoic-edu.vercel.app`

Your site is now live and accessible to anyone on the internet. ✓

---

## How to add your content (Admin)

1. Register on the site with **your admin email** (the one in `ADMIN_EMAILS`)
2. You'll see an **Admin** link in the navbar
3. Go to Admin → **Sections** to create lesson containers
4. Go to Admin → **Questions** to add questions one by one
5. Go to Admin → **Import** to paste a full day's JSON at once (fastest method)

### Fastest way: JSON import

The JSON import tab accepts a full day's worth of content at once.
Paste this structure, fill in your content, click Import:

```json
{
  "day_number": 1,
  "plan_levels": [1, 2, 3],
  "sections": [
    {
      "title": "SAT Math — Linear Equations",
      "subject": "sat_math",
      "explanation": "Today we focus on solving linear equations...",
      "questions": [
        {
          "question_text": "If 3x + 6 = 21, what is x?",
          "option_a": "3",
          "option_b": "5",
          "option_c": "7",
          "option_d": "9",
          "correct_answer": "B",
          "explanation": "Subtract 6: 3x = 15. Divide by 3: x = 5.",
          "question_type": "mcq"
        }
      ]
    },
    {
      "title": "IELTS Reading — Vocabulary Focus",
      "subject": "ielts",
      "explanation": "Read the passage and answer the vocabulary questions.",
      "questions": [
        {
          "question_text": "What does 'exacerbate' mean in paragraph 2?",
          "option_a": "to improve",
          "option_b": "to worsen",
          "option_c": "to ignore",
          "option_d": "to describe",
          "correct_answer": "B",
          "explanation": "'Exacerbate' means to make something worse.",
          "question_type": "passage",
          "passage_text": "Paste your IELTS passage text here..."
        }
      ]
    }
  ]
}
```

**Subject values**: `sat_math` | `sat_english` | `ielts` | `vocab`
**Plan levels**: `[1,2,3]` = all students, `[1]` = intensive only, `[1,2]` = intensive + mid

---

## Plan Level Guide

| Level | Name       | Students it's for                                         |
|-------|------------|-----------------------------------------------------------|
| 1     | Intensive  | English is weak — needs IELTS + SAT + Math, strict pace  |
| 2     | Mid-Level  | Decent English — focus on SAT improvement + mistakes     |
| 3     | Light      | Strong English — fix weak spots only, flexible schedule  |

Content assigned to `plan_levels: [1]` only appears for Level 1 students.
Content assigned to `plan_levels: [1,2,3]` appears for everyone.

---

## Project Structure

```
stoic-edu/
├── frontend/         React + Vite app
│   └── src/
│       ├── pages/    Landing, Dashboard, Calendar, Session, StudyRoom, Vocabulary, Admin
│       ├── components/
│       └── lib/      api.js, auth.js
├── backend/          Node.js + Express API
│   ├── routes/       auth, students, questions, vocabulary, mistakes, sessions, admin
│   └── db/           Supabase client
└── supabase/
    └── schema.sql    Run once to create all tables
```

---

## Adding your logo

Replace `/public/favicon.svg` with your Stoic Edu logo.
Add your logo image to `frontend/public/` and reference it in `Navbar.jsx` and `Landing.jsx`.

---

## Company

**Stoic Edu** — Moonstone cyan (#69B4C8) and white color scheme.
