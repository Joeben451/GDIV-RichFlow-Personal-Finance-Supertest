import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading, user, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect based on user type
  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, loading, navigate, isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // Navigation is handled by useEffect based on user type
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking session
  if (loading) {
    return (
      <div className="rf-auth-page">
        <div className="text-(--color-gold) text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="rf-auth-page">
      <div className="rf-auth-card">
        <div className="rf-auth-logo">
          <div className="rf-auth-logo-icon">
            <img src="/assets/richflow.png" alt="RichFlow Logo" />
          </div>
          <span className="rf-auth-logo-text">RichFlow</span>
        </div>

        <form onSubmit={handleLogin} className="rf-auth-form">
          {error && (
            <div className="rf-auth-error">{error}</div>
          )}
          
          <input 
            type="email" 
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rf-auth-input"
            required
          />

          <input 
            type="password" 
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rf-auth-input"
            required
          />

          <button 
            type="submit"
            disabled={isLoading}
            className="rf-auth-btn"
          >
            {isLoading ? 'Loading...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;