import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CurrencySelector from '../CurrencySelector/CurrencySelector';
import './Sidebar.css';

type Props = {
  onOpenAssistant?: () => void;
  mobileOpen?: boolean;
  onToggleSidebar?: () => void;
};

const Sidebar: React.FC<Props> = ({ onOpenAssistant, mobileOpen = false, onToggleSidebar }) => {
  const [showCurrencyModal, setShowCurrencyModal] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  // Determine if we're on the analysis page
  const isAnalysisPage = location.pathname === '/analysis';
  const dynamicPageLabel = isAnalysisPage ? 'Dashboard' : 'Analysis';
  const dynamicPageRoute = isAnalysisPage ? '/dashboard' : '/analysis';

  const handleAssistantClick = () => {
    if (onOpenAssistant) {
      onOpenAssistant();
      if (mobileOpen && onToggleSidebar) {
        onToggleSidebar();
      }
    }
  };

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
      console.error('Logout error:', error);
      // Still navigate to landing page even if logout fails
      navigate('/');
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      ></div>

      <aside 
        className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}
      >
      
      {/* User Info Section */}
      <div className="sidebar-user-info">
        <div className="sidebar-user-avatar">
          <img src="/assets/richflow.png" alt="RichFlow Logo" className="sidebar-user-logo" />
        </div>
        <div className="sidebar-user-details">
          <span className="sidebar-user-name">{user?.name}</span>
          <span className="sidebar-user-email">{user?.email}</span>
        </div>
      </div>

      {/* Home Button */}
      <div className="sidebar-section">
        <button 
          className="selection large" 
          onClick={() => { navigate("/"); closeSidebar(); }}
        > 
          <div className="sidebar-button large"></div>
          <span className="sidebar-text home"> Home </span>
        </button>
      </div>

      {/* General Section */}
      <div className="sidebar-section">
        <button className="selection small">
          <div className="sidebar-button small"></div>
          <span className="sidebar-text"> General </span>
        </button>

        <button 
          className="selection large" 
          onClick={() => { navigate("/user-guide"); closeSidebar(); }}
        > 
          <div className="sidebar-button large"></div>
          <span className="sidebar-text"> User Guide </span>
        </button>

        <button 
          className="selection large" 
          onClick={() => setShowCurrencyModal(true)}
        > 
          <div className="sidebar-button large"></div>
          <span className="sidebar-text"> Change Currency </span>
        </button>

        {!isAnalysisPage && (
          <button 
            className="selection large"
            onClick={handleAssistantClick}
          > 
            <div className="sidebar-button large"></div>
            <span className="sidebar-text"> Saki Assistant </span>
          </button>
        )}

        <button 
          className="selection large" 
          onClick={() => { navigate('/event-log'); closeSidebar(); }}
        >
          <div className="sidebar-button large"></div>
          <span className="sidebar-text"> View Event Log </span>
        </button> 
        
        <button 
          className="selection large" 
          onClick={() => { navigate(dynamicPageRoute); closeSidebar(); }}
        > 
          <div className="sidebar-button large"></div>
          <span className="sidebar-text"> {dynamicPageLabel} </span>
        </button>
      </div>

      {/* Settings Section */}
      <div className="sidebar-section">
        <button className="selection small">
          <div className="sidebar-button small"></div>
          <span className="sidebar-text"> Settings </span>
        </button>

        <button 
          className="selection large" 
          onClick={() => { navigate('/change-username'); closeSidebar(); }}
        > 
          <div className="sidebar-button large"></div>
          <span className="sidebar-text"> Change Username </span>
        </button>

        <button 
          className="selection large" 
          onClick={() => { navigate('/change-email'); closeSidebar(); }}
        > 
          <div className="sidebar-button large"></div>
          <span className="sidebar-text"> Change Email </span>
        </button>

        <button 
          className="selection large" 
          onClick={() => { navigate('/change-password'); closeSidebar(); }}
        > 
          <div className="sidebar-button large"></div>
          <span className="sidebar-text"> Change Password </span>
        </button>

        <button 
          className="selection large" 
          onClick={() => { handleLogout(); closeSidebar(); }}
        > 
          <div className="sidebar-button large"></div>
          <span className="sidebar-text"> Log Out </span>
        </button>
      </div>

      {/* Currency Selection Modal */}
      {showCurrencyModal && (
        <div className="currency-modal-overlay" onClick={() => setShowCurrencyModal(false)}>
          <div className="currency-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="currency-modal-header">
              <h2>Select Currency</h2>
              <button className="currency-modal-close" onClick={() => setShowCurrencyModal(false)}>×</button>
            </div>
            <div className="currency-modal-body">
              <CurrencySelector onCurrencyChange={() => setShowCurrencyModal(false)} />
            </div>
          </div>
        </div>
      )}

      </aside>
    </>
  );
};

export default Sidebar;
