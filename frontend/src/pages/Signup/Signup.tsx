import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../utils/api';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!formData.username || !formData.email || !formData.password) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError('Password must contain uppercase, lowercase, and numbers');
      setLoading(false);
      return;
    }

    try {
      // Logout first to clear any existing session (user state + tokens)
      // This ensures user is fully logged out if they were previously authenticated
      await logout();

      const data = await authAPI.signup(formData.username, formData.email, formData.password);

      // Success - clear form and redirect to login
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      alert('Account created successfully! You can now log in.');
      navigate('/login');

    } catch (err: any) {
      setError(err.message || 'Something went wrong during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rf-auth-page">
      <div className="rf-auth-card" style={{ minHeight: '600px' }}>
        <div className="rf-auth-logo">
          <div className="rf-auth-logo-icon">
            <img src="/assets/richflow.png" alt="RichFlow Logo" />
          </div>
          <span className="rf-auth-logo-text">RichFlow</span>
        </div>

        <form onSubmit={handleSubmit} className="rf-auth-form">
          {error && (
            <div className="rf-auth-error">{error}</div>
          )}
          
          <input 
            type="text" 
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="rf-auth-input"
          />
          
          <input 
            type="email" 
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="rf-auth-input"
            required
          />
          
          <input 
            type="password" 
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="rf-auth-input"
            required
          />
          
          <input 
            type="password" 
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="rf-auth-input"
            required
          />
          
          <button 
            type="submit"
            disabled={loading}
            className="rf-auth-btn"
          >
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;