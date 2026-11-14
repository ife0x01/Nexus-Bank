import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar    from './components/Sidebar';
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import Accounts   from './pages/Accounts';
import Transfer   from './pages/Transfer';
import Statements from './pages/Statements';
import Profile    from './pages/Profile';
import Support    from './pages/Support';

function Guard({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const authed = !!localStorage.getItem('token');
  return (
    <div className="app-shell">
      {authed && <Sidebar />}
      <div className={authed ? 'main-content' : ''} style={{ flex: 1 }}>
        <Routes>
          <Route path="/login"      element={<Login />} />
          <Route path="/"           element={<Guard><Dashboard /></Guard>} />
          <Route path="/accounts"   element={<Guard><Accounts /></Guard>} />
          <Route path="/transfer"   element={<Guard><Transfer /></Guard>} />
          <Route path="/statements" element={<Guard><Statements /></Guard>} />
          <Route path="/profile"    element={<Guard><Profile /></Guard>} />
          <Route path="/support"    element={<Guard><Support /></Guard>} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
