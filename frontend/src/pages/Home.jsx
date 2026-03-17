import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/products')
      .then(res => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f4c8a 100%)',
        minHeight: '320px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <span className="badge mb-3 px-3 py-2" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', borderRadius: '50px', fontSize: '0.8rem', border: '1px solid rgba(96,165,250,0.3)' }}>
                🔒 Trusted Security Solutions
              </span>
              <h1 className="display-5 fw-bold text-white mb-3 lh-sm">
                Premium Security<br />
                <span style={{ color: '#60a5fa' }}>Products & Systems</span>
              </h1>
              <p className="text-white-50 mb-4" style={{ maxWidth: '480px' }}>
                Professional-grade surveillance, access control, and alarm systems for homes and businesses.
              </p>
              <div className="d-flex gap-2">
                <a href="#products" className="btn btn-primary px-4 fw-semibold" style={{ borderRadius: '10px' }}>
                  Shop Now
                </a>
                <Link to="/orders" className="btn px-4" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px' }}>
                  My Orders
                </Link>
              </div>
            </div>
            <div className="col-lg-5 d-none d-lg-flex justify-content-end">
              <div className="d-flex flex-wrap gap-3 justify-content-end">
                {['🔐', '📷', '🚨', '🛡️'].map((icon, i) => (
                  <div key={i} className="d-flex align-items-center justify-content-center rounded-3 shadow"
                    style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.08)', fontSize: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {icon}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Products ───────────────────────────────────────── */}
      <div id="products" className="container py-5">

        {/* Search bar */}
        <div className="row mb-4 align-items-center">
          <div className="col-md-6">
            <h2 className="fw-bold text-dark mb-0">Our Products</h2>
            <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
              {products.length} product{products.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <div className="col-md-6 mt-3 mt-md-0">
            <div className="position-relative">
              <span className="position-absolute top-50 translate-middle-y ms-3 text-muted">🔍</span>
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ borderRadius: '12px', border: '1px solid #e2e8f0', padding: '10px 14px 10px 40px' }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />
            <p className="text-muted mt-3">Loading products...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: '3rem' }}>📦</div>
            <p className="text-muted mt-2">{search ? 'No products match your search.' : 'No products available yet.'}</p>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-4 g-4">
            {filtered.map(product => (
              <div key={product.id} className="col">
                <Link
                  to={`/products/${product.slug}`}
                  className="card h-100 border-0 shadow-sm text-decoration-none product-card"
                  style={{ borderRadius: '14px', overflow: 'hidden' }}
                >
                  {/* Image */}
                  <div style={{ height: '210px', background: '#f1f5f9', overflow: 'hidden', position: 'relative' }}>
                    {product.first_image ? (
                      <img
                        src={`data:image/jpeg;base64,${product.first_image}`}
                        alt={product.name}
                        className="img-product"
                      />
                    ) : (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                        <span style={{ fontSize: '2.5rem', opacity: 0.3 }}>📷</span>
                      </div>
                    )}
                    {/* Category badge */}
                    {product.category && (
                      <span className="badge position-absolute top-0 start-0 m-2 px-2 py-1"
                        style={{ background: 'rgba(15,23,42,0.65)', color: '#93c5fd', borderRadius: '6px', fontSize: '0.7rem', backdropFilter: 'blur(4px)' }}>
                        {product.category}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="card-body p-3">
                    <h6 className="fw-bold text-dark mb-1 lh-sm" style={{ fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.name}
                    </h6>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <span className="fw-bold" style={{ color: '#1d4ed8', fontSize: '1.05rem' }}>
                        RM {parseFloat(product.price).toFixed(2)}
                      </span>
                      <span className={`badge ${product.stock > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
                        style={{ fontSize: '0.7rem', borderRadius: '6px' }}>
                        {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="card-footer bg-transparent border-0 pt-0 pb-3 px-3">
                    <div className="btn btn-primary w-100 btn-sm fw-semibold" style={{ borderRadius: '8px' }}>
                      View Product
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer style={{ background: '#0f172a', color: '#94a3b8' }} className="py-4 mt-5">
        <div className="container text-center">
          <p className="mb-0" style={{ fontSize: '0.875rem' }}>
            © 2024 <span className="text-white fw-semibold">Izwan Systec</span> — Professional Security Solutions
          </p>
        </div>
      </footer>
    </>
  );
}
