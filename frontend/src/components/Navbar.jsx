import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearAuth, getUser } from '../lib/auth';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();

  function logout() {
    clearAuth();
    navigate('/');
  }

  const links = [
    { to: '/dashboard',  label: 'Home' },
    { to: '/calendar',   label: 'Calendar' },
    { to: '/study-room', label: 'Study Room' },
    { to: '/vocabulary', label: 'Vocab' },
  ];
  if (user?.role === 'admin') links.push({ to: '/admin', label: 'Admin' });

  return (
    <nav className="navbar">
      <div className="navbar-inner" style={{ maxWidth: 1000, margin: '0 auto', width: '100%', padding: '0 1.25rem' }}>
        <Link to="/dashboard" className="navbar-brand">
          <img
            src="/logo.png"
            alt="Stoic Edu"
            style={{ width: 34, height: 34, objectFit: 'contain' }}
          />
          <span>Stoic Edu</span>
        </Link>
        <div className="navbar-links">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`nav-link ${location.pathname === l.to ? 'active' : ''}`}
            >
              <span>{l.label}</span>
            </Link>
          ))}
          <button onClick={logout} className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
