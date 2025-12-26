import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      navigate('/');
    }
  };

  return (
    <>
      <header className="rf-header">
        {/* Left side - Hamburger */}
        <button
          className={`rf-hamburger ${sidebarOpen ? 'open' : ''}`}
          onClick={handleMenuClick}
          aria-label="Toggle menu"
        >
          <span className="rf-hamburger-line"></span>
          <span className="rf-hamburger-line"></span>
          <span className="rf-hamburger-line"></span>
        </button>

        {/* Center - Title */}
        <h1 className="rf-header-title">Admin Panel</h1>

        {/* Right side - Logo */}
        <div className="flex items-center gap-2">
          <img src="/assets/richflow.png" alt="RichFlow" className="w-10 h-10 object-contain" />
        </div>
      </header>

      {/* Sidebar Overlay */}
      <div 
        className={`rf-sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={handleMenuClick}
      />

      {/* Sidebar */}
      <aside className={`rf-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* User Info Section */}
        <div className="rf-sidebar-user">
          <div className="rf-sidebar-avatar">
            <img src="/assets/richflow.png" alt="Admin" />
          </div>
          <div className="rf-sidebar-user-details">
            <span className="rf-sidebar-user-name">{user?.name || 'Administrator'}</span>
            <span className="rf-sidebar-user-email">{user?.email || 'admin@richflow.app'}</span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="rf-sidebar-section">
          <button className="rf-sidebar-btn" onClick={() => { navigate('/'); handleMenuClick(); }}>
            <span className="rf-sidebar-text home">Home</span>
          </button>
        </div>

        {/* General Section */}
        <div className="rf-sidebar-section">
          <button className="rf-sidebar-label">
            <span>Navigation</span>
          </button>
          <button className="rf-sidebar-btn" onClick={() => { navigate('/dashboard'); handleMenuClick(); }}>
            <span className="rf-sidebar-text">Back to Dashboard</span>
          </button>
        </div>

        {/* Account Section */}
        <div className="rf-sidebar-section">
          <button className="rf-sidebar-label">
            <span>Account</span>
          </button>
          <button className="rf-sidebar-btn" onClick={() => { handleLogout(); handleMenuClick(); }}>
            <span className="rf-sidebar-text">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminHeader;
