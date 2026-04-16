require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/vocabulary', require('./routes/vocabulary'));
app.use('/api/mistakes', require('./routes/mistakes'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ─── Live Study Room (Socket.io) ──────────────────────────────────────────────
// Tracks who is currently studying and for how long.
// Students see each other's names + duration but cannot chat.

const studyingNow = new Map(); // socketId -> { name, startedAt }

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Student starts studying
  socket.on('study:start', ({ name }) => {
    studyingNow.set(socket.id, { name, startedAt: Date.now() });
    broadcastStudyRoom();
  });

  // Student stops studying
  socket.on('study:stop', () => {
    studyingNow.delete(socket.id);
    broadcastStudyRoom();
  });

  socket.on('disconnect', () => {
    studyingNow.delete(socket.id);
    broadcastStudyRoom();
  });
});

function broadcastStudyRoom() {
  const now = Date.now();
  const list = Array.from(studyingNow.entries()).map(([id, data]) => ({
    name: data.name,
    secondsStudying: Math.floor((now - data.startedAt) / 1000)
  }));
  io.emit('study:update', list);
}

// Keep durations ticking every 30 seconds
setInterval(broadcastStudyRoom, 30000);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Stoic Edu API running on port ${PORT}`));
