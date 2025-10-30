import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Sidebar from '../../components/Sidebar/Sidebar';
import IncomeSection from '../../components/IncomeSection/IncomeSection';
import SummarySection from '../../components/SummarySection/SummarySection';
import ExpensesSection from '../../components/ExpensesSection/ExpensesSection';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    
    if (!token) {
      // No token found, redirect to login
      navigate('/login');
      return;
    }
    
    // Optional: Verify token is still valid with backend
    const verifyToken = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          // Token invalid, clear and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        navigate('/login');
      }
    };
    
    verifyToken();
  }, [navigate]);

  return (
    <div className="dashboard-container">
      <Header />
      <div className="dashboard-main">
        <Sidebar />
        <main className="dashboard-content" style={{ backgroundColor: '#000000' }}>
          <div className="dashboard-grid">
            <div className="grid-left">
              <IncomeSection />
            </div>
            <div className="grid-right">
              <div className="grid-right-top">
                <SummarySection />
              </div>
              <div className="grid-right-bottom">
                <ExpensesSection />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
