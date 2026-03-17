import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Account() {
  const { user, login } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [pwMsg, setPwMsg] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);
    try {
      const res = await api.patch('/auth/profile', profileForm);
      const token = localStorage.getItem('token');
      login(token, res.data.user);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwForm.new_password.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    setPwLoading(true);
    try {
      await api.patch('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwMsg({ type: 'success', text: 'Password changed successfully.' });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-7">

          {/* Header */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white"
              style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', fontSize: '1.3rem' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="fw-bold text-dark mb-0">{user?.name}</h4>
              <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{user?.email}</p>
            </div>
          </div>

          {/* Edit Profile */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold text-dark mb-1">Edit Profile</h5>
              <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>Update your personal information</p>

              {profileMsg && (
                <div className={`alert py-2 px-3 ${profileMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`}
                  style={{ borderRadius: '10px', fontSize: '0.875rem' }}>
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleProfileSave}>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted" style={{ fontSize: '0.85rem' }}>Full Name *</label>
                  <input
                    type="text" required
                    value={profileForm.name}
                    onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                    className="form-control"
                    style={{ borderRadius: '10px', padding: '10px 14px' }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted" style={{ fontSize: '0.85rem' }}>Email Address *</label>
                  <input
                    type="email" required
                    value={profileForm.email}
                    onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                    className="form-control"
                    style={{ borderRadius: '10px', padding: '10px 14px' }}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold text-muted" style={{ fontSize: '0.85rem' }}>Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                    className="form-control"
                    placeholder="e.g. 0123456789"
                    style={{ borderRadius: '10px', padding: '10px 14px' }}
                  />
                </div>
                <div className="d-flex justify-content-end">
                  <button type="submit" disabled={profileLoading}
                    className="btn btn-primary fw-semibold px-4"
                    style={{ borderRadius: '10px' }}>
                    {profileLoading ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Change Password */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold text-dark mb-1">Change Password</h5>
              <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>Update your account password</p>

              {pwMsg && (
                <div className={`alert py-2 px-3 ${pwMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`}
                  style={{ borderRadius: '10px', fontSize: '0.875rem' }}>
                  {pwMsg.text}
                </div>
              )}

              <form onSubmit={handlePasswordSave}>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted" style={{ fontSize: '0.85rem' }}>Current Password</label>
                  <input
                    type="password" required
                    value={pwForm.current_password}
                    onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                    className="form-control"
                    style={{ borderRadius: '10px', padding: '10px 14px' }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted" style={{ fontSize: '0.85rem' }}>New Password</label>
                  <input
                    type="password" required
                    value={pwForm.new_password}
                    onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                    className="form-control"
                    style={{ borderRadius: '10px', padding: '10px 14px' }}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold text-muted" style={{ fontSize: '0.85rem' }}>Confirm New Password</label>
                  <input
                    type="password" required
                    value={pwForm.confirm_password}
                    onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                    className="form-control"
                    style={{ borderRadius: '10px', padding: '10px 14px' }}
                  />
                </div>
                <div className="d-flex justify-content-end">
                  <button type="submit" disabled={pwLoading}
                    className="btn fw-semibold px-4"
                    style={{ borderRadius: '10px', background: '#1e293b', color: '#fff' }}>
                    {pwLoading ? <><span className="spinner-border spinner-border-sm me-2" />Updating...</> : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
