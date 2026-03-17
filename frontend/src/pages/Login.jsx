import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-9 col-md-7 col-lg-5 col-xl-4">
            {/* Logo */}
            <div className="text-center mb-4">
              <span style={{ fontSize: '2.5rem', color: '#60a5fa' }}>⬡</span>
              <h4 className="text-white fw-bold mt-2 mb-0">Izwan Systec</h4>
              <small className="text-white-50">Sign in to your account</small>
            </div>

            <div className="card border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="card-body p-4 p-md-5">
                <h5 className="fw-bold mb-4 text-dark">Welcome back</h5>

                {error && (
                  <div className="alert alert-danger py-2 px-3 d-flex align-items-center gap-2" style={{ borderRadius: '10px', fontSize: '0.875rem' }}>
                    <span>⚠️</span> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-muted" style={{ fontSize: '0.85rem' }}>Email Address</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="form-control"
                      placeholder="you@example.com"
                      style={{ borderRadius: '10px', padding: '10px 14px' }}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold text-muted" style={{ fontSize: '0.85rem' }}>Password</label>
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="form-control"
                      placeholder="Enter your password"
                      style={{ borderRadius: '10px', padding: '10px 14px' }}
                    />
                  </div>

                  <button type="submit" disabled={loading}
                    className="btn btn-primary w-100 fw-semibold"
                    style={{ borderRadius: '10px', padding: '11px', fontSize: '0.95rem' }}>
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" /> Signing in...</>
                    ) : 'Sign In'}
                  </button>
                </form>

                <hr className="my-4" />
                <p className="text-center text-muted mb-0" style={{ fontSize: '0.875rem' }}>
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary fw-semibold text-decoration-none">
                    Create account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
