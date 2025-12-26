import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

type SettingsType = 'username' | 'email' | 'password';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: SettingsType;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, initialType = 'username' }) => {
  const { user, updateUsername, updateEmail, changePassword } = useAuth();
  const [settingsType, setSettingsType] = useState<SettingsType>(initialType);
  
  // Form states
  const [currentConfirm, setCurrentConfirm] = useState('');
  const [newValue, setNewValue] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  
  // UI states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when type changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setSettingsType(initialType);
      resetForm();
    }
  }, [isOpen, initialType]);

  const resetForm = () => {
    setCurrentConfirm('');
    setNewValue('');
    setConfirmNew('');
    setCurrentPassword('');
    setError(null);
    setSuccess(null);
  };

  const handleTypeChange = (type: SettingsType) => {
    setSettingsType(type);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user && settingsType !== 'password') {
      setError('You must be logged in to change your settings');
      return;
    }

    try {
      setIsSaving(true);

      if (settingsType === 'username') {
        if (currentConfirm.trim() !== user?.name) {
          setError('Current username does not match. Please type your current username to confirm.');
          return;
        }
        if (!newValue.trim()) {
          setError('New username cannot be empty');
          return;
        }
        if (newValue !== confirmNew) {
          setError('New username and confirmation do not match');
          return;
        }
        await updateUsername(newValue.trim());
        setSuccess('Username updated successfully');
      } else if (settingsType === 'email') {
        if (currentConfirm.trim() !== user?.email) {
          setError('Current email does not match. Please type your current email to confirm.');
          return;
        }
        if (!newValue.trim()) {
          setError('New email cannot be empty');
          return;
        }
        if (newValue !== confirmNew) {
          setError('New email and confirmation do not match');
          return;
        }
        await updateEmail(newValue.trim());
        setSuccess('Email updated successfully');
      } else if (settingsType === 'password') {
        if (!currentPassword) {
          setError('Please enter your current password');
          return;
        }
        if (!newValue) {
          setError('New password cannot be empty');
          return;
        }
        if (newValue !== confirmNew) {
          setError('New password and confirmation do not match');
          return;
        }
        await changePassword(currentPassword, newValue);
        setSuccess('Password updated successfully');
      }

      resetForm();
    } catch (err: any) {
      setError(err?.message || `Failed to update ${settingsType}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const getTitle = () => {
    switch (settingsType) {
      case 'username': return 'Change Username';
      case 'email': return 'Change Email';
      case 'password': return 'Change Password';
    }
  };

  const getCurrentValue = () => {
    switch (settingsType) {
      case 'username': return user?.name || '—';
      case 'email': return user?.email || '—';
      case 'password': return null;
    }
  };

  const getInputType = () => {
    switch (settingsType) {
      case 'username': return 'text';
      case 'email': return 'email';
      case 'password': return 'password';
    }
  };

  return (
    <div className="rf-modal-overlay" onClick={handleOverlayClick}>
      <div className="rf-settings-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="rf-modal-header">
          <h2 className="rf-modal-title">{getTitle()}</h2>
          <button className="rf-modal-close" onClick={onClose}>×</button>
        </div>

        {/* Tab Buttons */}
        <div className="rf-settings-tabs">
          <button
            type="button"
            className={`rf-settings-tab ${settingsType === 'username' ? 'active' : ''}`}
            onClick={() => handleTypeChange('username')}
          >
            Username
          </button>
          <button
            type="button"
            className={`rf-settings-tab ${settingsType === 'email' ? 'active' : ''}`}
            onClick={() => handleTypeChange('email')}
          >
            Email
          </button>
          <button
            type="button"
            className={`rf-settings-tab ${settingsType === 'password' ? 'active' : ''}`}
            onClick={() => handleTypeChange('password')}
          >
            Password
          </button>
        </div>

        {/* Current Value Display */}
        {getCurrentValue() && (
          <p className="rf-settings-note">
            Current {settingsType}: <strong>{getCurrentValue()}</strong>
          </p>
        )}

        {/* Form */}
        <form className="rf-settings-form" onSubmit={handleSubmit}>
          {error && <div className="rf-settings-error">{error}</div>}
          {success && <div className="rf-settings-success">{success}</div>}

          {settingsType === 'password' ? (
            <>
              <label>
                Current password
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </label>

              <label>
                New password
                <input
                  type="password"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </label>

              <label>
                Confirm new password
                <input
                  type="password"
                  value={confirmNew}
                  onChange={(e) => setConfirmNew(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </label>
            </>
          ) : (
            <>
              <label>
                Confirm current {settingsType}
                <input
                  type={getInputType()}
                  value={currentConfirm}
                  onChange={(e) => setCurrentConfirm(e.target.value)}
                  placeholder={`Type your current ${settingsType}`}
                  required
                />
              </label>

              <label>
                New {settingsType}
                <input
                  type={getInputType()}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={`Enter new ${settingsType}`}
                  required
                />
              </label>

              <label>
                Confirm new {settingsType}
                <input
                  type={getInputType()}
                  value={confirmNew}
                  onChange={(e) => setConfirmNew(e.target.value)}
                  placeholder={`Confirm new ${settingsType}`}
                  required
                />
              </label>
            </>
          )}

          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : `Update ${settingsType.charAt(0).toUpperCase() + settingsType.slice(1)}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
