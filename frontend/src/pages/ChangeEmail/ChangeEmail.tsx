import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ChangeEmail.css';

const ChangeEmail: React.FC = () => {
  const { user, updateEmail } = useAuth();
  const navigate = useNavigate();

  const [currentConfirm, setCurrentConfirm] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError('You must be logged in to change your email');
      return;
    }

    if (currentConfirm.trim() !== user.email) {
      setError('Current email does not match. Please type your current email to confirm.');
      return;
    }

    if (!newEmail.trim()) {
      setError('New email cannot be empty');
      return;
    }

    if (newEmail !== confirmNew) {
      setError('New email and confirmation do not match');
      return;
    }

    try {
      setIsSaving(true);
      await updateEmail(newEmail.trim());
      setSuccess('Email updated successfully');
      setCurrentConfirm('');
      setNewEmail('');
      setConfirmNew('');
      // Optionally navigate back or leave on page
    } catch (err: any) {
      setError(err?.message || 'Failed to update email');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="change-email-page">
      <div className="change-email-card">
        <button type="button" className="change-email-back-button" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
        <h2>Change Email</h2>
        <p className="change-email-small-note">Your current email: <strong>{user?.email || '—'}</strong></p>

        <form className="change-email-form" onSubmit={handleSubmit}>
          {error && <div className="change-email-error">{error}</div>}
          {success && <div className="change-email-success">{success}</div>}

          <label className="full">
            Confirm current email
            <input
              type="email"
              value={currentConfirm}
              onChange={(e) => setCurrentConfirm(e.target.value)}
              placeholder="Type your current email"
              required
            />
          </label>

          <label>
            New email
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="New email"
              required
            />
          </label>

          <label>
            Confirm new email
            <input
              type="email"
              value={confirmNew}
              onChange={(e) => setConfirmNew(e.target.value)}
              placeholder="Confirm new email"
              required
            />
          </label>

          <button className="full" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Change Email'}</button>
        </form>
      </div>
    </div>
  );
};

export default ChangeEmail;
