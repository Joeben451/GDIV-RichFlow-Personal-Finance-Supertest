import React from 'react';
import AdminHeader from '../../components/AdminHeader/AdminHeader';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import AdminPanel from '../../components/AdminPanel/AdminPanel';
import './Admin.css';

const Admin: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="dashboard-container">
      <AdminHeader 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      <div className="dashboard-main">
        <AdminSidebar 
          mobileOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <AdminPanel />
      </div>
    </div>
  );
};

export default Admin;
