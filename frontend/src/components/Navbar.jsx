import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top" style={{ background: 'linear-gradient(90deg, #0f172a 0%, #1e3a5f 100%)', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand fw-bold fs-5 d-flex align-items-center gap-2" to="/">
          <span style={{ color: '#60a5fa', fontSize: '1.3rem' }}>⬡</span>
          <span className="text-white">Izwan <span style={{ color: '#60a5fa' }}>Systec</span></span>
        </Link>

        <button className="navbar-toggler border-0" type="button"
          data-bs-toggle="collapse" data-bs-target="#navbarMain">
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarMain">
          {/* Center links */}
          <ul className="navbar-nav me-auto ms-3 gap-1">
            <li className="nav-item">
              <Link className="nav-link text-white-75 px-3" to="/">Shop</Link>
            </li>
          </ul>

          {/* Right side */}
          <div className="d-flex align-items-center gap-2">
            {user ? (
              <>
                {/* Cart */}
                <Link to="/cart"
                  className="btn btn-sm px-3"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}>
                  🛒 Cart
                </Link>

                {/* User dropdown */}
                <div className="dropdown">
                  <button
                    className="btn btn-sm dropdown-toggle d-flex align-items-center gap-2"
                    style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px' }}
                    data-bs-toggle="dropdown">
                    <span className="d-inline-flex align-items-center justify-content-center rounded-circle fw-bold"
                      style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                    <span className="d-none d-md-inline">{user.name}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-1" style={{ borderRadius: '12px', minWidth: '180px' }}>
                    <li className="px-3 py-2 border-bottom">
                      <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Signed in as</small>
                      <span className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>{user.email}</span>
                    </li>
                    <li>
                      <Link className="dropdown-item py-2" to="/account">
                        👤 My Profile
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item py-2" to="/orders">
                        📦 My Orders
                      </Link>
                    </li>
                    {user.role === 'admin' && (
                      <>
                        <li><hr className="dropdown-divider my-1" /></li>
                        <li>
                          <Link className="dropdown-item py-2" to="/admin">
                            ⚙️ Admin Panel
                          </Link>
                        </li>
                      </>
                    )}
                    <li><hr className="dropdown-divider my-1" /></li>
                    <li>
                      <button className="dropdown-item py-2 text-danger" onClick={handleLogout}>
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login"
                  className="btn btn-sm"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '8px' }}>
                  Login
                </Link>
                <Link to="/register"
                  className="btn btn-sm btn-primary"
                  style={{ borderRadius: '8px' }}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
