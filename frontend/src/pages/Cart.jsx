import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchCart = () => {
    api.get('/cart')
      .then(res => setCart(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (itemId, qty) => {
    try {
      await api.put(`/cart/items/${itemId}`, { qty });
      fetchCart();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      fetchCart();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" />
          <p className="text-muted">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="fw-bold text-dark mb-1">Shopping Cart</h1>
      <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
        {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} in your cart
      </p>

      {cart.items.length === 0 ? (
        <div className="text-center py-5">
          <div style={{ fontSize: '4rem', opacity: 0.3 }}>🛒</div>
          <h5 className="fw-bold text-dark mt-3 mb-1">Your cart is empty</h5>
          <p className="text-muted mb-4">Add some products to get started.</p>
          <Link to="/" className="btn btn-primary px-4" style={{ borderRadius: '10px' }}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {/* Cart items */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <div className="card-body p-0">
                {cart.items.map((item, index) => (
                  <div key={item.id}
                    className={`p-4 d-flex align-items-center gap-3 ${index < cart.items.length - 1 ? 'border-bottom' : ''}`}>
                    {/* Image */}
                    <div className="rounded-2 overflow-hidden flex-shrink-0 bg-light d-flex align-items-center justify-content-center"
                      style={{ width: 80, height: 80, border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>📦</span>
                    </div>

                    {/* Info */}
                    <div className="flex-grow-1 min-w-0">
                      <h6 className="fw-bold text-dark mb-1 text-truncate">{item.name}</h6>
                      <p className="text-primary fw-semibold mb-2" style={{ fontSize: '0.9rem' }}>
                        RM {parseFloat(item.price).toFixed(2)} each
                      </p>
                      <div className="d-flex align-items-center gap-3">
                        {/* Qty control */}
                        <div className="d-flex align-items-center border rounded-2 overflow-hidden"
                          style={{ borderColor: '#e2e8f0' }}>
                          <button
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            disabled={item.qty <= 1}
                            className="btn btn-sm border-0 px-2 py-1"
                            style={{ background: '#f8fafc', minWidth: 32 }}>−</button>
                          <span className="px-3 fw-semibold" style={{ fontSize: '0.9rem' }}>{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            disabled={item.qty >= item.stock}
                            className="btn btn-sm border-0 px-2 py-1"
                            style={{ background: '#f8fafc', minWidth: 32 }}>+</button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="btn btn-sm text-danger border-0 px-0"
                          style={{ fontSize: '0.8rem', background: 'transparent' }}>
                          🗑 Remove
                        </button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="text-end flex-shrink-0">
                      <span className="fw-bold text-dark" style={{ fontSize: '1.05rem' }}>
                        RM {parseFloat(item.subtotal).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <Link to="/" className="text-decoration-none text-primary" style={{ fontSize: '0.875rem' }}>
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order summary */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <div className="card-body p-4">
                <h5 className="fw-bold text-dark mb-4">Order Summary</h5>

                <div className="d-flex justify-content-between text-muted mb-2" style={{ fontSize: '0.875rem' }}>
                  <span>Subtotal ({cart.items.length} items)</span>
                  <span>RM {parseFloat(cart.total).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between text-muted mb-2" style={{ fontSize: '0.875rem' }}>
                  <span>Shipping</span>
                  <span className="text-success">Free</span>
                </div>

                <hr />

                <div className="d-flex justify-content-between fw-bold text-dark mb-4">
                  <span>Total</span>
                  <span className="fs-5">RM {parseFloat(cart.total).toFixed(2)}</span>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="btn btn-primary w-100 fw-semibold"
                  style={{ borderRadius: '12px', padding: '12px' }}>
                  Proceed to Checkout →
                </button>

                <div className="mt-3 text-center">
                  <small className="text-muted">🔒 Secure checkout</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
