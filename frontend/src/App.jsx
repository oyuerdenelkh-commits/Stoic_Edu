import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn, getUser } from './lib/auth';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Session from './pages/Session';
import StudyRoom from './pages/StudyRoom';
import Vocabulary from './pages/Vocabulary';
import AdminPanel from './pages/AdminPanel';

function RequireAuth({ children }) {
  return isLoggedIn() ? children : <Navigate to="/" replace />;
}

function RequireAdmin({ children }) {
  const user = getUser();
  if (!isLoggedIn()) return <Navigate to="/" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={
          <RequireAuth><Onboarding /></RequireAuth>
        } />
        <Route path="/dashboard" element={
          <RequireAuth><Navbar /><Dashboard /></RequireAuth>
        } />
        <Route path="/calendar" element={
          <RequireAuth><Navbar /><Calendar /></RequireAuth>
        } />
        <Route path="/session/:day" element={
          <RequireAuth><Navbar /><Session /></RequireAuth>
        } />
        <Route path="/study-room" element={
          <RequireAuth><Navbar /><StudyRoom /></RequireAuth>
        } />
        <Route path="/vocabulary" element={
          <RequireAuth><Navbar /><Vocabulary /></RequireAuth>
        } />
        <Route path="/admin" element={
          <RequireAdmin><Navbar /><AdminPanel /></RequireAdmin>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
