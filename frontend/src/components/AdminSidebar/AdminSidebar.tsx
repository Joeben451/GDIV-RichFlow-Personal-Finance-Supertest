import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminSidebar.css';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onToggleSidebar?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ mobileOpen = false, onToggleSidebar }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const closeSidebar = () => {
    if (mobileOpen && onToggleSidebar) {
      onToggleSidebar();
    }
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
      {/* Mobile Overlay */}
      <div 
        className={`admin-sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      ></div>

      <aside 
        className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`} 
      >
      {/* User Info Section */}
      <div className="admin-sidebar-user-info">
        <div className="admin-sidebar-user-avatar">
          <img src="/assets/richflow.png" alt="RichFlow Logo" className="admin-sidebar-user-logo" />
        </div>
        <div className="admin-sidebar-user-details">
          <span className="admin-sidebar-user-name">{user?.name || 'Admin'}</span>
          <span className="admin-sidebar-user-email">{user?.email || 'admin@richflow.com'}</span>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="admin-sidebar-section">
        <button className="selection large" onClick={() => { handleLogout(); closeSidebar(); }}> 
          <div className="admin-sidebar-button large"></div>
          <span className="admin-sidebar-text"> Log Out </span>
        </button>
      </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
