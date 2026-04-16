const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('stoic_token');
}

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  register: (body)  => req('POST', '/auth/register', body),
  login:    (body)  => req('POST', '/auth/login', body),
  me:       ()      => req('GET',  '/auth/me'),

  // Student
  setPlan:  (level) => req('PUT',  '/students/plan', { plan_level: level }),
  progress: ()      => req('GET',  '/students/progress'),
  markDone: (body)  => req('POST', '/students/progress', body),
  stats:    ()      => req('GET',  '/students/stats'),

  // Questions
  dayContent: (day) => req('GET', `/questions/day/${day}`),
  answer:     (id, answer) => req('POST', `/questions/${id}/answer`, { answer }),

  // Vocabulary
  getVocab:    ()     => req('GET',    '/vocabulary'),
  addVocab:    (body) => req('POST',   '/vocabulary', body),
  updateVocab: (id, body) => req('PUT', `/vocabulary/${id}`, body),
  deleteVocab: (id)   => req('DELETE', `/vocabulary/${id}`),

  // Mistakes
  getMistakes: ()     => req('GET',  '/mistakes'),
  addMistake:  (body) => req('POST', '/mistakes', body),

  // Sessions
  startSession: ()    => req('POST', '/sessions/start'),
  endSession:   (id)  => req('POST', `/sessions/${id}/end`),
  sessionTotals: ()   => req('GET',  '/sessions/totals'),

  // Admin
  admin: {
    getSections:     ()     => req('GET',    '/admin/sections'),
    createSection:   (body) => req('POST',   '/admin/sections', body),
    updateSection:   (id, body) => req('PUT', `/admin/sections/${id}`, body),
    deleteSection:   (id)   => req('DELETE', `/admin/sections/${id}`),
    getQuestions:    (sid)  => req('GET',    `/admin/sections/${sid}/questions`),
    createQuestions: (body) => req('POST',   '/admin/questions', body),
    updateQuestion:  (id, body) => req('PUT', `/admin/questions/${id}`, body),
    deleteQuestion:  (id)   => req('DELETE', `/admin/questions/${id}`),
    import:          (body) => req('POST',   '/admin/import', body),
    getStudents:     ()     => req('GET',    '/admin/students'),
  }
};
