import { useState, useEffect } from 'react';
import api from '../../services/api';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700'
};

const orderStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
const paymentStatuses = ['pending', 'paid', 'failed'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = () => {
    api.get('/orders/admin')
      .then(res => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id, fields) => {
    setUpdating(true);
    try {
      await api.patch(`/orders/admin/${id}/status`, fields);
      fetchOrders();
      if (selected?.id === id) {
        setSelected(prev => ({ ...prev, ...fields }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-64"><p className="text-gray-400">Loading...</p></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No orders</td></tr>
            ) : (
              orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{o.order_number}</p>
                    <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('en-MY')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900">{o.customer_name}</p>
                    <p className="text-xs text-gray-400">{o.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">RM {parseFloat(o.total_price).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.order_status}
                      onChange={e => updateStatus(o.id, { order_status: e.target.value })}
                      disabled={updating}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${statusColors[o.order_status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {orderStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.payment_status}
                      onChange={e => updateStatus(o.id, { payment_status: e.target.value })}
                      disabled={updating}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${statusColors[o.payment_status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {paymentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 capitalize">{o.payment_method}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
