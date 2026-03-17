import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    api.get(`/products/${slug}`)
      .then(res => setProduct(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = async () => {
    if (!user) return navigate('/login');
    setAdding(true);
    try {
      await api.post('/cart/items', { product_id: product.id, qty });
      setAddedToCart(true);
      setMessage({ text: 'Added to cart!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to add', type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" />
          <p className="text-muted">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="container py-5">
      {/* Breadcrumb */}
      <nav className="mb-4">
        <ol className="breadcrumb" style={{ fontSize: '0.85rem' }}>
          <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-primary">Home</Link></li>
          {product.category && <li className="breadcrumb-item text-muted">{product.category}</li>}
          <li className="breadcrumb-item active text-muted">{product.name}</li>
        </ol>
      </nav>

      <div className="row g-5">
        {/* ── Images ── */}
        <div className="col-lg-6">
          {/* Main image */}
          <div className="rounded-3 overflow-hidden bg-light d-flex align-items-center justify-content-center shadow-sm"
            style={{ height: '420px', border: '1px solid #e2e8f0' }}>
            {product.images?.length > 0 ? (
              <img
                src={`data:image/jpeg;base64,${product.images[activeImage]}`}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <span style={{ fontSize: '4rem', opacity: 0.3 }}>📷</span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="d-flex gap-2 mt-3 flex-wrap">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className="p-0 border-0 bg-transparent"
                  style={{ width: 72, height: 72 }}>
                  <div className="rounded-2 overflow-hidden w-100 h-100"
                    style={{ border: `2px solid ${i === activeImage ? '#3b82f6' : '#e2e8f0'}` }}>
                    <img
                      src={`data:image/jpeg;base64,${img}`}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className="col-lg-6">
          {product.category && (
            <span className="badge mb-2 px-3 py-2"
              style={{ background: '#eff6ff', color: '#3b82f6', borderRadius: '20px', fontSize: '0.8rem' }}>
              {product.category}
            </span>
          )}

          <h1 className="fw-bold text-dark mb-2" style={{ fontSize: '1.6rem', lineHeight: 1.3 }}>
            {product.name}
          </h1>

          <div className="d-flex align-items-center gap-3 mb-3">
            <span className="fw-bold" style={{ fontSize: '2rem', color: '#1d4ed8' }}>
              RM {parseFloat(product.price).toFixed(2)}
            </span>
          </div>

          {/* Stock */}
          <div className="mb-4">
            {product.stock > 0 ? (
              <span className="badge bg-success-subtle text-success px-3 py-2" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>
                ✓ In Stock ({product.stock} available)
              </span>
            ) : (
              <span className="badge bg-danger-subtle text-danger px-3 py-2" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>
                ✗ Out of Stock
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-4 p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <p className="text-muted mb-0 lh-lg" style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                {product.description}
              </p>
            </div>
          )}

          {/* Quantity + Add to cart */}
          {product.stock > 0 && (
            <>
              <div className="d-flex align-items-center gap-3 mb-3">
                <label className="fw-semibold text-muted" style={{ fontSize: '0.85rem' }}>Quantity:</label>
                <div className="d-flex align-items-center border rounded-2 overflow-hidden"
                  style={{ borderColor: '#e2e8f0' }}>
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="btn btn-sm border-0 px-3 py-2 text-muted"
                    style={{ background: '#f8fafc' }}>−</button>
                  <span className="px-3 fw-semibold">{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    className="btn btn-sm border-0 px-3 py-2 text-muted"
                    style={{ background: '#f8fafc' }}>+</button>
                </div>
              </div>

              {message.text && (
                <div className={`alert py-2 px-3 mb-3 ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`}
                  style={{ borderRadius: '10px', fontSize: '0.875rem' }}>
                  {message.text}
                </div>
              )}

              <div className="d-flex gap-2">
                <button
                  onClick={addToCart}
                  disabled={adding}
                  className="btn btn-primary fw-semibold flex-grow-1"
                  style={{ borderRadius: '12px', padding: '12px' }}>
                  {adding ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Adding...</>
                  ) : addedToCart ? '✓ Added to Cart' : '🛒 Add to Cart'}
                </button>
                {addedToCart && (
                  <Link to="/cart"
                    className="btn fw-semibold"
                    style={{ borderRadius: '12px', padding: '12px 20px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>
                    View Cart
                  </Link>
                )}
              </div>
            </>
          )}

          {/* Features */}
          <div className="mt-4 pt-4 border-top">
            <div className="row g-3">
              {[
                { icon: '🚚', title: 'Fast Delivery', desc: 'Nationwide shipping' },
                { icon: '🛡️', title: 'Warranty', desc: '1-year coverage' },
                { icon: '🔧', title: 'Installation', desc: 'Pro support available' },
              ].map(f => (
                <div key={f.title} className="col-4 text-center">
                  <div style={{ fontSize: '1.5rem' }}>{f.icon}</div>
                  <p className="fw-semibold mb-0" style={{ fontSize: '0.75rem', color: '#374151' }}>{f.title}</p>
                  <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
