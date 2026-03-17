import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const statusConfig = {
  pending:    { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  processing: { bg: '#dbeafe', color: '#1e40af', label: 'Processing' },
  shipped:    { bg: '#ede9fe', color: '#6d28d9', label: 'Shipped' },
  completed:  { bg: '#d1fae5', color: '#065f46', label: 'Completed' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
  paid:       { bg: '#d1fae5', color: '#065f46', label: 'Paid' },
  failed:     { bg: '#fee2e2', color: '#991b1b', label: 'Failed' },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || { bg: '#f3f4f6', color: '#6b7280', label: status };
  return (
    <span className="badge px-2 py-1"
      style={{ background: cfg.bg, color: cfg.color, borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
      {cfg.label}
    </span>
  );
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my')
      .then(res => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="mb-4">
        <h1 className="fw-bold text-dark mb-1">My Orders</h1>
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>
          {orders.length} order{orders.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-5">
          <div style={{ fontSize: '4rem', opacity: 0.3 }}>📦</div>
          <h5 className="fw-bold text-dark mt-3 mb-1">No orders yet</h5>
          <p className="text-muted mb-4">Looks like you haven't placed any orders.</p>
          <Link to="/" className="btn btn-primary px-4" style={{ borderRadius: '10px' }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {orders.map(order => (
            <div key={order.id} className="card border-0 shadow-sm" style={{ borderRadius: '14px' }}>
              <div className="card-body p-4">
                <div className="row align-items-center g-3">
                  {/* Order number & date */}
                  <div className="col-sm-5">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span style={{ fontSize: '1.2rem' }}>🧾</span>
                      <span className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>
                        {order.order_number}
                      </span>
                    </div>
                    <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
                      {new Date(order.created_at).toLocaleDateString('en-MY', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Status badges */}
                  <div className="col-sm-4">
                    <div className="d-flex flex-wrap gap-2">
                      <StatusBadge status={order.order_status} />
                      <StatusBadge status={order.payment_status} />
                    </div>
                    <p className="text-muted mt-1 mb-0" style={{ fontSize: '0.78rem', textTransform: 'capitalize' }}>
                      via {order.payment_method}
                    </p>
                  </div>

                  {/* Total */}
                  <div className="col-sm-3 text-sm-end">
                    <span className="fw-bold" style={{ fontSize: '1.15rem', color: '#1d4ed8' }}>
                      RM {parseFloat(order.total_price).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
