import React from 'react';
import AdminHeader from '../../components/AdminHeader/AdminHeader';
import AdminPanel from '../../components/AdminPanel/AdminPanel';

const Admin: React.FC = () => {
  return (
    <div className="rf-dashboard">
      <AdminHeader />
      <div className="rf-dashboard-main">
        <AdminPanel />
      </div>
    </div>
  );
};

export default Admin;
