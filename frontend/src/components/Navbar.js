import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      {/* Brand */}
      <div style={styles.brand}>⚡ BizFlow</div>

      {/* Nav Links */}
      <div style={styles.links}>
        <Link
          to="/dashboard"
          style={{
            ...styles.link,
            ...(isActive('/dashboard') ? styles.activeLink : {}),
          }}
        >
          Dashboard
        </Link>
        <Link
          to="/issues"
          style={{
            ...styles.link,
            ...(isActive('/issues') ? styles.activeLink : {}),
          }}
        >
          Issues
        </Link>
        <Link
          to="/assigned"
          style={{
            ...styles.link,
            ...(isActive('/assigned') ? styles.activeLink : {}),
          }}
        >
          Assigned Tasks
        </Link>
      </div>

      {/* User Info + Logout */}
      <div style={styles.userSection}>
        <span style={styles.userInfo}>
          👤 {user?.name} &nbsp;|&nbsp;
          <span style={styles.badge}>{user?.category}</span>
        </span>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4f46e5',
    padding: '12px 24px',
    color: 'white',
    flexWrap: 'wrap',
    gap: '10px',
  },
  brand: {
    fontSize: '20px',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  links: {
    display: 'flex',
    gap: '20px',
  },
  link: {
    color: 'rgba(255,255,255,0.8)',
    textDecoration: 'none',
    fontSize: '15px',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  activeLink: {
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.2)',
    fontWeight: 'bold',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userInfo: {
    fontSize: '14px',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.4)',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
};

export default Navbar;