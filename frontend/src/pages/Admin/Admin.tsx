import React from 'react';
import AdminHeader from '../../components/AdminHeader/AdminHeader';
import Sidebar from '../../components/Sidebar/Sidebar';
import IncomeSection from '../../components/IncomeSection/IncomeSection';
import AdminPanel from '../../components/AdminPanel/AdminPanel';
import ExpensesSection from '../../components/ExpensesSection/ExpensesSection';
import './Admin.css';

const Admin: React.FC = () => {
  return (
    <div className="dashboard-container">
      <AdminHeader />
      <AdminPanel />
    </div>
  );
};

export default Admin;
