import React from 'react';
import './AdminHeader.css';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar, sidebarOpen = false }) => {
  return (
    <header className="header">
      <div className="header-left">
        {onToggleSidebar && (
          <button 
            className={`sidebar-hamburger ${sidebarOpen ? 'open' : ''}`}
            onClick={onToggleSidebar}
            aria-label="Toggle menu"
          >
            <span className="sidebar-hamburger-line"></span>
            <span className="sidebar-hamburger-line"></span>
            <span className="sidebar-hamburger-line"></span>
          </button>
        )}
      </div>
      <div className="header-center">
        <h1 className="header-title">Administrator Panel</h1>
      </div>
      <div className="header-right">
      </div>
    </header>
  );
};

export default AdminHeader;
