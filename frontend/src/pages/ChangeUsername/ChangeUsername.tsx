import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ChangeUsername: React.FC = () => {
  const { user, updateUsername } = useAuth();
  const navigate = useNavigate();
  const [currentConfirm, setCurrentConfirm] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError('You must be logged in to change your username');
      return;
    }

    if (currentConfirm.trim() !== user.name) {
      setError('Current username does not match. Please type your current username to confirm.');
      return;
    }

    if (!newUsername.trim()) {
      setError('New username cannot be empty');
      return;
    }

    if (newUsername !== confirmNew) {
      setError('New username and confirmation do not match');
      return;
    }

    try {
      setIsSaving(true);
      // Update locally for now; backend persistence can be added later
      await updateUsername(newUsername.trim());
      setSuccess('Username updated successfully');
      setCurrentConfirm('');
      setNewUsername('');
      setConfirmNew('');
    } catch (err: any) {
      setError(err?.message || 'Failed to update username');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rf-settings-page">
      <div className="rf-settings-card">
        <button type="button" className="rf-settings-back-btn" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
        <h2>Change Username</h2>
        <p className="rf-settings-note">Your current username: <strong>{user?.name || '—'}</strong></p>

        <form className="rf-settings-form" onSubmit={handleSubmit}>
          {error && <div className="rf-settings-error">{error}</div>}
          {success && <div className="rf-settings-success">{success}</div>}

          <label>
            Confirm current username
            <input
              type="text"
              value={currentConfirm}
              onChange={(e) => setCurrentConfirm(e.target.value)}
              placeholder="Type your current username"
              required
            />
          </label>

          <label>
            New username
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="New username"
              required
            />
          </label>

          <label>
            Confirm new username
            <input
              type="text"
              value={confirmNew}
              onChange={(e) => setConfirmNew(e.target.value)}
              placeholder="Confirm new username"
              required
            />
          </label>

          <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Change Username'}</button>
        </form>
      </div>
    </div>
  );
};

export default ChangeUsername;
