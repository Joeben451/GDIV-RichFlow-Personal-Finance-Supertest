import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminSidebar.css';

const AdminSidebar: React.FC = () => {
  const [expanded, setExpanded] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

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
      {/* Hamburger Menu Button - Mobile Only */}
      <button 
        className={`admin-sidebar-hamburger ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle admin menu"
      >
        <span className="admin-sidebar-hamburger-line"></span>
        <span className="admin-sidebar-hamburger-line"></span>
        <span className="admin-sidebar-hamburger-line"></span>
      </button>

      {/* Mobile Overlay */}
      <div 
        className={`admin-sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={() => setMobileOpen(false)}
      ></div>

      <aside 
        className={`admin-sidebar ${expanded ? 'expanded' : ''} ${mobileOpen ? 'mobile-open' : ''}`} 
        onMouseEnter={() => setExpanded(true)} 
        onMouseLeave={() => setExpanded(false)}
      >
      {/* Logout Button */}
      <div className="admin-sidebar-section">
        <button className="admin-sidebar-item" onClick={() => { handleLogout(); setMobileOpen(false); }}> 
          <div className="admin-sidebar-icon"></div>
          <span className="admin-sidebar-text">Log Out</span>
        </button>
      </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
