import React from "react";
import { Link } from "react-router-dom";
import { User } from "../../interfaces/navigatorIntfs";


const Header: React.FC<{
    currentUser: User | null;
    onLogin: () => void;
    onLogout: () => void;
  }> = ({ currentUser, onLogin, onLogout }) => (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="logo">
          <h1>Fair Chance Navigator 2.0</h1>
          <p>Building Inclusive Hiring Strategies</p>
        </Link>
  
        <nav className="header-nav">
          <Link to="/" className="nav-link">Home</Link>
          {!currentUser && <Link to="/program" className="nav-link">Program</Link>}
          {currentUser && <Link to="/articles" className="nav-link">Articles</Link>}
          {/* Link to Forms */}
          {currentUser && <Link to="/dashboard" className="nav-link">Dashboard</Link>}
          <Link to="/faq" className="nav-link">FAQ</Link>
        </nav>
  
        <div className="user-info">
          {currentUser ? (
            <div className="user-menu">
              <span>Welcome, {currentUser.name}</span>
              <Link to="/team" className="team-btn">Team</Link>
              {currentUser.role === 'admin' && <Link to="/admin" className="admin-btn">Admin</Link>}
              <button onClick={onLogout} className="logout-btn">Logout</button>
            </div>
          ) : (
            <button onClick={onLogin} className="login-btn">Login / Sign Up</button>
          )}
        </div>
      </div>
    </header>
  );
  export default Header;