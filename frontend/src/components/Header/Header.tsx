import React, { useState, useEffect, useRef } from 'react';

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
    <header className="rf-header">
        {leftContent ? leftContent : (
          onToggleSidebar && (
            <button 
              className={`rf-hamburger ${sidebarOpen ? 'open' : ''}`}
              onClick={onToggleSidebar}
              aria-label="Toggle menu"
            >
              <span className="rf-hamburger-line"></span>
              <span className="rf-hamburger-line"></span>
              <span className="rf-hamburger-line"></span>
            </button>
          )
        )}
        <h1 className="rf-header-title">{title}</h1>
        {rightContent}
        {!hideActions && (
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              className={`rf-btn-gold ${balanceSheetExists ? 'bg-(--color-purple) text-white hover:bg-(--color-purple-light)]' : ''}`}
              onClick={toggleDropdown}
              title={balanceSheetExists ? 'Modify Balance Sheet' : 'Add new item'}
            >
              {balanceSheetExists ? '-' : '+'}
            </button>
            {isDropdownOpen && (
              <div className="rf-dropdown">
                <button className="rf-dropdown-item" onClick={handleBalanceSheetAction}>
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
