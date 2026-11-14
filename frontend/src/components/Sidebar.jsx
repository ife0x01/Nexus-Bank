import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getStoredUser } from '../api';

const NAV = [
  { to: '/',           icon: '⬛', label: 'Dashboard'  },
  { to: '/accounts',   icon: '💳', label: 'Accounts'   },
  { to: '/transfer',   icon: '↗',  label: 'Transfer'   },
  { to: '/statements', icon: '📄', label: 'Statements' },
  { to: '/support',    icon: '💬', label: 'Support'    },
  { to: '/profile',    icon: '⚙',  label: 'Settings'   },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U';

  function logout() {
    localStorage.clear();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">🏦</div>
          <div>
            <div className="logo-name">Nexus</div>
            <div className="logo-tagline">Personal Banking</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">{user?.role || 'customer'}</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Sign out">✕</button>
        </div>
      </div>
    </aside>
  );
}
