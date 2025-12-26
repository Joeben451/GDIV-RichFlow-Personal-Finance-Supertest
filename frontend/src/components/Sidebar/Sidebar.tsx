import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CurrencySelector from '../CurrencySelector/CurrencySelector';
import SettingsModal from '../SettingsModal/SettingsModal';

type SettingsType = 'username' | 'email' | 'password';

type Props = {
  onOpenAssistant?: () => void;
  onOpenActivity?: () => void;
  mobileOpen?: boolean;
  onToggleSidebar?: () => void;
};

const Sidebar: React.FC<Props> = ({ onOpenAssistant, onOpenActivity, mobileOpen = false, onToggleSidebar }) => {
  const [showCurrencyModal, setShowCurrencyModal] = React.useState(false);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [settingsType, setSettingsType] = React.useState<SettingsType>('username');
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

  const handleActivityClick = () => {
    if (onOpenActivity) {
      onOpenActivity();
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

  const openSettingsModal = (type: SettingsType) => {
    setSettingsType(type);
    setShowSettingsModal(true);
    closeSidebar();
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
        className={`rf-sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      ></div>

      <aside 
        className={`rf-sidebar ${mobileOpen ? 'open' : ''}`}
      >
      
      {/* User Info Section */}
      <div className="rf-sidebar-user">
        <div className="rf-sidebar-avatar">
          <img src="/assets/richflow.png" alt="RichFlow Logo" />
        </div>
        <div className="rf-sidebar-user-details">
          <span className="rf-sidebar-user-name">{user?.name}</span>
          <span className="rf-sidebar-user-email">{user?.email}</span>
        </div>
      </div>

      {/* Home Button */}
      <div className="rf-sidebar-section">
        <button 
          className="rf-sidebar-btn" 
          onClick={() => { navigate("/"); closeSidebar(); }}
        > 
          <span className="rf-sidebar-text home"> Home </span>
        </button>
      </div>

      {/* General Section */}
      <div className="rf-sidebar-section">
        <button className="rf-sidebar-label">
          <span> General </span>
        </button>

        <button 
          className="rf-sidebar-btn" 
          onClick={() => { navigate("/user-guide"); closeSidebar(); }}
        > 
          <span className="rf-sidebar-text"> User Guide </span>
        </button>

        <button 
          className="rf-sidebar-btn" 
          onClick={() => setShowCurrencyModal(true)}
        > 
          <span className="rf-sidebar-text"> Change Currency </span>
        </button>

        {!isAnalysisPage && (
          <button 
            className="rf-sidebar-btn"
            onClick={handleAssistantClick}
          > 
            <span className="rf-sidebar-text"> Saki Assistant </span>
          </button>
        )}

        {!isAnalysisPage && (
          <button 
            className="rf-sidebar-btn"
            onClick={handleActivityClick}
          > 
            <span className="rf-sidebar-text"> Recent Activity </span>
          </button>
        )}

        <button 
          className="rf-sidebar-btn" 
          onClick={() => { navigate('/event-log'); closeSidebar(); }}
        >
          <span className="rf-sidebar-text"> View Event Log </span>
        </button> 
        
        <button 
          className="rf-sidebar-btn" 
          onClick={() => { navigate(dynamicPageRoute); closeSidebar(); }}
        > 
          <span className="rf-sidebar-text"> {dynamicPageLabel} </span>
        </button>
      </div>

      {/* Settings Section */}
      <div className="rf-sidebar-section">
        <button className="rf-sidebar-label">
          <span> Settings </span>
        </button>

        <button 
          className="rf-sidebar-btn" 
          onClick={() => openSettingsModal('username')}
        > 
          <span className="rf-sidebar-text"> Change Username </span>
        </button>

        <button 
          className="rf-sidebar-btn" 
          onClick={() => openSettingsModal('email')}
        > 
          <span className="rf-sidebar-text"> Change Email </span>
        </button>

        <button 
          className="rf-sidebar-btn" 
          onClick={() => openSettingsModal('password')}
        > 
          <span className="rf-sidebar-text"> Change Password </span>
        </button>

        <button 
          className="rf-sidebar-btn" 
          onClick={() => { handleLogout(); closeSidebar(); }}
        > 
          <span className="rf-sidebar-text"> Log Out </span>
        </button>
      </div>

      </aside>

      {/* Currency Selection Modal - outside aside to avoid stacking context issues */}
      {showCurrencyModal && (
        <div className="rf-modal-overlay" onClick={() => setShowCurrencyModal(false)}>
          <div className="rf-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="rf-modal-header">
              <h2 className="rf-modal-title">Select Currency</h2>
              <button className="rf-modal-close" onClick={() => setShowCurrencyModal(false)}>×</button>
            </div>
            <div className="flex justify-center">
              <CurrencySelector onCurrencyChange={() => setShowCurrencyModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal - outside aside to avoid stacking context issues */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        initialType={settingsType}
      />
    </>
  );
};

export default Sidebar;
