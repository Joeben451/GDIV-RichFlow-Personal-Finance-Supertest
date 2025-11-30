import React, { useState, useEffect, useRef } from 'react';
import './Header.css';

interface HeaderProps {
  onAddBalanceSheet?: () => void;
  onToggleBalanceSheet?: (show: boolean) => void;
  balanceSheetExists?: boolean;
  balanceSheetVisible?: boolean;
  title?: string;
  hideActions?: boolean;
  rightContent?: React.ReactNode;
  leftContent?: React.ReactNode;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  onAddBalanceSheet, 
  onToggleBalanceSheet, 
  balanceSheetExists, 
  balanceSheetVisible = false, 
  title = 'Dashboard', 
  hideActions = false,
  rightContent,
  leftContent,
  onToggleSidebar,
  sidebarOpen = false
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  const handleBalanceSheetAction = () => {
    setIsDropdownOpen(false);
    if (balanceSheetExists) {
      // Toggle visibility without confirmation for a smoother UX
      onToggleBalanceSheet?.(!balanceSheetVisible);
    } else {
      onAddBalanceSheet?.();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);
  
  return (
    <header className={`header ${hideActions ? 'no-actions' : ''}`}>
        {leftContent ? leftContent : (
          onToggleSidebar && (
            <button 
              className={`sidebar-hamburger ${sidebarOpen ? 'open' : ''}`}
              onClick={onToggleSidebar}
              aria-label="Toggle menu"
            >
              <span className="sidebar-hamburger-line"></span>
              <span className="sidebar-hamburger-line"></span>
              <span className="sidebar-hamburger-line"></span>
            </button>
          )
        )}
        <h1 className="header-title">{title}</h1>
        {rightContent}
        {!hideActions && (
          <div className="add-button-container" ref={dropdownRef}>
            <button
              className={`add-button ${balanceSheetExists ? 'minus-button' : ''}`}
              onClick={toggleDropdown}
              title={balanceSheetExists ? 'Modify Balance Sheet' : 'Add new item'}
            >
              {balanceSheetExists ? '-' : '+'}
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={handleBalanceSheetAction}>
                  {balanceSheetExists ? (balanceSheetVisible ? 'Hide Balance Sheet' : 'Show Balance Sheet') : 'Add Balance Sheet'}
                </button>
              </div>
            )}
          </div>
        )}
    </header>
  );
};

export default Header;
