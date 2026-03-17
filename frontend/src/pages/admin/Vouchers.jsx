import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discount_type: 'percent', discount_value: '', usage_limit: '', expiry_date: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchVouchers = () => {
    api.get('/vouchers/admin')
      .then(res => setVouchers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVouchers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/vouchers/admin', {
        ...form,
        usage_limit: form.usage_limit || undefined,
        expiry_date: form.expiry_date || undefined
      });
      setMessage('Voucher created');
      setShowForm(false);
      setForm({ code: '', discount_type: 'percent', discount_value: '', usage_limit: '', expiry_date: '' });
      fetchVouchers();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await api.patch(`/vouchers/admin/${id}/status`, { status: newStatus });
      fetchVouchers();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update');
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-64"><p className="text-gray-400">Loading...</p></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vouchers</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + New Voucher
        </button>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-600 text-sm px-4 py-3 rounded-lg mb-4">
          {message}
          <button onClick={() => setMessage('')} className="ml-2 text-blue-400">×</button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create Voucher</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Code</label>
              <input
                required
                placeholder="e.g. SAVE10"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Discount Type</label>
              <select
                value={form.discount_type}
                onChange={e => setForm({ ...form, discount_type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="percent">Percent (%)</option>
                <option value="amount">Fixed Amount (RM)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Discount Value {form.discount_type === 'percent' ? '(%)' : '(RM)'}
              </label>
              <input
                required type="number" step="0.01" min="0"
                value={form.discount_value}
                onChange={e => setForm({ ...form, discount_value: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Usage Limit (optional)</label>
              <input
                type="number" min="1"
                value={form.usage_limit}
                onChange={e => setForm({ ...form, usage_limit: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Expiry Date (optional)</label>
              <input
                type="datetime-local"
                value={form.expiry_date}
                onChange={e => setForm({ ...form, expiry_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Creating...' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Discount</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Expiry</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vouchers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No vouchers</td></tr>
            ) : (
              vouchers.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{v.code}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {v.discount_type === 'percent' ? `${v.discount_value}%` : `RM ${parseFloat(v.discount_value).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {v.used_count} / {v.usage_limit || '∞'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {v.expiry_date ? new Date(v.expiry_date).toLocaleDateString('en-MY') : 'No expiry'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleStatus(v.id, v.status)}
                      className={`text-xs px-3 py-1 rounded-lg ${v.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {v.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
