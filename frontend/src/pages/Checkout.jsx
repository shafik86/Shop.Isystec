import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const gatewayLabels = {
  stripe: { label: 'Credit Card (Stripe)', icon: '💳' },
  senangpay: { label: 'FPX / Card (SenangPay)', icon: '🏦' },
  billplz: { label: 'Online Banking (Billplz)', icon: '🏧' },
};

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [gateways, setGateways] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherInfo, setVoucherInfo] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/cart'),
      api.get('/payment/methods')
    ]).then(([cartRes, gatewayRes]) => {
      setCart(cartRes.data);
      setGateways(gatewayRes.data);
      if (gatewayRes.data.length > 0) setPaymentMethod(gatewayRes.data[0].name);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherError('');
    setVoucherInfo(null);
    try {
      const res = await api.get(`/vouchers/validate/${voucherCode.trim()}`);
      if (res.data.valid) setVoucherInfo(res.data);
      else setVoucherError(res.data.message);
    } catch {
      setVoucherError('Failed to validate voucher');
    }
  };

  const getDiscount = () => {
    if (!voucherInfo) return 0;
    if (voucherInfo.discount_type === 'percent') return cart.total * (voucherInfo.discount_value / 100);
    return Math.min(cart.total, voucherInfo.discount_value);
  };

  const finalTotal = Math.max(0, cart.total - getDiscount());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paymentMethod) return;
    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        payment_method: paymentMethod,
        voucher_code: voucherInfo ? voucherCode : undefined
      });
      navigate('/order-success', { state: { order: res.data.order } });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (cart.items.length === 0) { navigate('/cart'); return null; }

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="mb-4">
        <h1 className="fw-bold text-dark mb-1">Checkout</h1>
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>Complete your order below</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Left col */}
          <div className="col-lg-7">

            {/* Payment Method */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
              <div className="card-body p-4">
                <h5 className="fw-bold text-dark mb-1">Payment Method</h5>
                <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>Choose how you'd like to pay</p>

                {gateways.length === 0 ? (
                  <div className="alert alert-warning py-2" style={{ borderRadius: '10px' }}>No payment methods available</div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {gateways.map(g => {
                      const info = gatewayLabels[g.name] || { label: g.name, icon: '💰' };
                      const selected = paymentMethod === g.name;
                      return (
                        <label key={g.name}
                          className="d-flex align-items-center gap-3 p-3 rounded-3 cursor-pointer"
                          style={{
                            border: `2px solid ${selected ? '#3b82f6' : '#e2e8f0'}`,
                            background: selected ? '#eff6ff' : '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}>
                          <input
                            type="radio"
                            name="payment"
                            value={g.name}
                            checked={selected}
                            onChange={e => setPaymentMethod(e.target.value)}
                            className="form-check-input mt-0"
                          />
                          <span style={{ fontSize: '1.3rem' }}>{info.icon}</span>
                          <span className="fw-semibold text-dark">{info.label}</span>
                          {selected && <span className="ms-auto badge bg-primary" style={{ fontSize: '0.7rem' }}>Selected</span>}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Voucher */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <div className="card-body p-4">
                <h5 className="fw-bold text-dark mb-1">Voucher Code</h5>
                <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>Have a discount code? Apply it here</p>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter voucher code"
                    value={voucherCode}
                    onChange={e => { setVoucherCode(e.target.value); setVoucherInfo(null); setVoucherError(''); }}
                    style={{ borderRadius: '10px 0 0 10px', borderRight: 'none' }}
                  />
                  <button type="button" onClick={applyVoucher}
                    className="btn btn-outline-primary fw-semibold"
                    style={{ borderRadius: '0 10px 10px 0' }}>
                    Apply
                  </button>
                </div>
                {voucherError && (
                  <p className="text-danger mt-2 mb-0" style={{ fontSize: '0.8rem' }}>❌ {voucherError}</p>
                )}
                {voucherInfo && (
                  <p className="text-success mt-2 mb-0" style={{ fontSize: '0.8rem' }}>✅ {voucherInfo.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right col - Summary */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm sticky-top" style={{ borderRadius: '16px', top: '80px' }}>
              <div className="card-body p-4">
                <h5 className="fw-bold text-dark mb-3">Order Summary</h5>

                <div className="d-flex flex-column gap-2 mb-3">
                  {cart.items.map(item => (
                    <div key={item.id} className="d-flex justify-content-between align-items-start"
                      style={{ fontSize: '0.875rem' }}>
                      <span className="text-muted me-2">{item.name} <span className="text-dark fw-semibold">×{item.qty}</span></span>
                      <span className="fw-semibold text-dark flex-shrink-0">RM {parseFloat(item.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <hr className="my-3" />

                <div className="d-flex justify-content-between text-muted mb-2" style={{ fontSize: '0.875rem' }}>
                  <span>Subtotal</span>
                  <span>RM {parseFloat(cart.total).toFixed(2)}</span>
                </div>
                {voucherInfo && (
                  <div className="d-flex justify-content-between text-success mb-2" style={{ fontSize: '0.875rem' }}>
                    <span>Discount ({voucherInfo.code})</span>
                    <span>− RM {getDiscount().toFixed(2)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between text-muted mb-3" style={{ fontSize: '0.875rem' }}>
                  <span>Shipping</span>
                  <span className="text-success">Free</span>
                </div>

                <hr className="my-3" />

                <div className="d-flex justify-content-between fw-bold text-dark mb-4">
                  <span className="fs-6">Total</span>
                  <span className="fs-5" style={{ color: '#1d4ed8' }}>RM {finalTotal.toFixed(2)}</span>
                </div>

                <button type="submit"
                  disabled={submitting || !paymentMethod}
                  className="btn btn-primary w-100 fw-bold"
                  style={{ borderRadius: '12px', padding: '13px', fontSize: '1rem' }}>
                  {submitting ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Placing order...</>
                  ) : '🛍 Place Order'}
                </button>

                <p className="text-center text-muted mt-3 mb-0" style={{ fontSize: '0.78rem' }}>
                  🔒 Your payment is secured and encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
