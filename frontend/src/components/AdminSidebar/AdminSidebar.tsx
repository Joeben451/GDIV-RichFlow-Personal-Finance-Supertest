import React from 'react';

// Note: The sidebar functionality has been moved to AdminHeader.tsx
// This component is kept for backwards compatibility but renders nothing
// The admin sidebar is now a dropdown menu triggered from the header hamburger button

const AdminSidebar: React.FC = () => {
  // Sidebar is now rendered as part of AdminHeader with rf-sidebar classes
  return null;
};

export default AdminSidebar;
