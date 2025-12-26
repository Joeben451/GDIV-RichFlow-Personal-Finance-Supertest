import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/globals.css';

// Eager-loaded components (critical path)
import Landing from './pages/Landing/Landing';
import Signup from './pages/Signup/Signup';
import Login from './pages/Login/login';
import Dashboard from './pages/Dashboard/Dashboard';

// Lazy-loaded components (reduce initial bundle size)
const UserGuide = lazy(() => import('./pages/UserGuide/UserGuide'));
const Admin = lazy(() => import('./pages/Admin/Admin'));
const EventLog = lazy(() => import('./pages/EventLog/EventLog'));
const Analysis = lazy(() => import('./pages/Analysis/Analysis'));

// Loading fallback component
const LoadingSpinner: React.FC = () => (
  <div 
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#EDCA69',
      fontSize: '1.25rem',
      fontFamily: 'Inter, sans-serif'
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div 
        style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid rgba(115, 69, 175, 0.3)',
          borderTop: '3px solid #7345AF',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} 
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      Loading...
    </div>
  </div>
);

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CurrencyProvider>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Eager-loaded routes (critical path) */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Lazy-loaded routes */}
                <Route 
                  path="/analysis" 
                  element={
                    <ProtectedRoute>
                      <Analysis />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/user-guide" 
                  element={
                    <ProtectedRoute>
                      <UserGuide />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/admin" element={<Admin />} />
                <Route
                  path="/event-log"
                  element={
                    <ProtectedRoute>
                      <EventLog />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
