import React from 'react';
import './login.css';

const Login: React.FC = () => {
  return (
    <div className="login-container">
      {/* Login Box */}
      <div className="login-box">
        <div className="logo-container">
          <img src="/assets/richflow.png" alt="RichFlow Logo" className="logo" />
          <h1 className="brand-name">RichFlow</h1>
        </div>

        {/* Login Form */}
        <form className="login-form">
          <label htmlFor="username">Username</label>
          <input type="text" id="username" placeholder="Enter your username" />

          <label htmlFor="password">Password</label>
          <input type="password" id="password" placeholder="Enter your password" />

          <button type="submit" className="login-btn">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
