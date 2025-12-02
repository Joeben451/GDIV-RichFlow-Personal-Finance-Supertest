import React from 'react';

const AdminHeader: React.FC = () => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <div className="logo-circle max-h-fit"><img src="/assets/richflow.png" alt="RichFlow Logo" className="logo-icon" /></div>
          <span className="logo-text">RichFlow</span>
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-5">
        <h1 className="text-[clamp(1.25rem,3vw+0.5rem,2rem)] font-bold text-(--color-gold) m-0 whitespace-nowrap pointer-events-auto max-md:text-[1.1rem] max-sm:text-[1rem]">Administrator Panel</h1>
      </div>
      <div className="flex-1 flex justify-end z-1">
      </div>
    </header>
  );
};

export default AdminHeader;
