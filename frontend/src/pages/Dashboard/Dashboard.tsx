
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { balanceSheetAPI } from '../../utils/api';
import Header from '../../components/Header/Header';
import Sidebar from '../../components/Sidebar/Sidebar';
import IncomeSection from '../../components/IncomeSection/IncomeSection';
import SummarySection from '../../components/SummarySection/SummarySection';
import ExpensesSection from '../../components/ExpensesSection/ExpensesSection';
import AssetsSection from '../../components/AssetsSection/AssetsSection';
import LiabilitiesSection from '../../components/LiabilitiesSection/LiabilitiesSection';
import RightSidePanel from '../../components/RightSidePanel/RightSidePanel';
import SakiAssistant from '../../components/RightSidePanel/SakiAssistant';
import ActivityFeed from '../../components/Dashboard/ActivityFeed';

type PanelContent = 'assistant' | 'activity';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  const [panelOpen, setPanelOpen] = useState<boolean>(false);
  const [panelContent, setPanelContent] = useState<PanelContent>('assistant');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [showBalanceSheet, setShowBalanceSheet] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('balanceSheetVisible');
      return stored === null ? true : stored === 'true';
    } catch (e) {
      return true;
    }
  });
  const [balanceSheetExists, setBalanceSheetExists] = useState(false);

  useEffect(() => {
    // Only redirect if loading is complete and user is not authenticated
    if (!loading && !isAuthenticated) {
      navigate('/'); // go to Landing instead of Login
    }
  }, [isAuthenticated, loading, navigate]);

  // Check if user has a balance sheet
  useEffect(() => {
    const checkBalanceSheet = async () => {
      if (!isAuthenticated) return;
      
      try {
        const balanceSheet = await balanceSheetAPI.getBalanceSheet();
        if (balanceSheet) {
          setBalanceSheetExists(true);
          // Respect user preference stored in localStorage
          try {
            const stored = localStorage.getItem('balanceSheetVisible');
            if (stored === null) {
              setShowBalanceSheet(true);
            } else {
              setShowBalanceSheet(stored === 'true');
            }
          } catch (e) {
            setShowBalanceSheet(true);
          }
        }
      } catch (error) {
        setBalanceSheetExists(false);
      }
    };

    checkBalanceSheet();
  }, [isAuthenticated]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-(--color-gold) text-2xl">Loading...</div>
      </div>
    );
  }

  // If not authenticated after loading, don't render (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const handleAddBalanceSheet = async () => {
    try {
      await balanceSheetAPI.createBalanceSheet();
      setBalanceSheetExists(true);
      setShowBalanceSheet(true);
    } catch (error) {
      // Error creating balance sheet - silently fail
    }
  };

  const handleToggleBalanceSheet = (show: boolean) => {
    setShowBalanceSheet(show);
    try {
      localStorage.setItem('balanceSheetVisible', show ? 'true' : 'false');
    } catch (e) {
      // ignore storage errors
    }
  };

  const handleOpenAssistant = () => {
    setPanelContent('assistant');
    setPanelOpen(true);
  };

  const handleOpenActivity = () => {
    setPanelContent('activity');
    setPanelOpen(true);
  };

  const getPanelTitle = () => {
    switch (panelContent) {
      case 'assistant':
        return 'Saki Assistant';
      case 'activity':
        return 'Recent Activity';
      default:
        return '';
    }
  };

  return (
    <div className="rf-dashboard">
      <Header 
        onAddBalanceSheet={handleAddBalanceSheet} 
        onToggleBalanceSheet={handleToggleBalanceSheet} 
        balanceSheetExists={balanceSheetExists} 
        balanceSheetVisible={showBalanceSheet}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      <div className="rf-dashboard-main">
        <Sidebar 
          onOpenAssistant={handleOpenAssistant}
          onOpenActivity={handleOpenActivity}
          mobileOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="rf-dashboard-content bg-black">
          <div className="rf-dashboard-grid">
            <div className="flex flex-col min-h-0">
              <IncomeSection />
            </div>
            <div className="flex flex-col gap-8 min-h-0">
              <div className="flex-1 min-h-[300px]">
                <SummarySection
                  balanceSheetVisible={showBalanceSheet}
                />
              </div>
              <div className="flex-1 min-h-[300px]">
                <ExpensesSection />
              </div>
            </div>
          </div>
          {showBalanceSheet && balanceSheetExists && (
            <div className="rf-balance-sheet">
              <AssetsSection />
              <LiabilitiesSection />
            </div>
          )}
        </main>
      </div>
      <RightSidePanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} title={getPanelTitle()}>
        {panelContent === 'assistant' && (
          <SakiAssistant isOpen={panelOpen} includeBalanceSheet={showBalanceSheet} />
        )}
        {panelContent === 'activity' && (
          <ActivityFeed limit={10} showTitle={false} />
        )}
      </RightSidePanel>
    </div>
  );
};

export default Dashboard;
