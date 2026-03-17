import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const STATUS_TABS = ['all', 'draft', 'published', 'archived'];

const statusConfig = {
  published: { bg: '#d1fae5', color: '#065f46' },
  draft:     { bg: '#fef3c7', color: '#92400e' },
  archived:  { bg: '#e2e8f0', color: '#64748b' },
};

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch]     = useState('');
  const [toast, setToast]       = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  const fetchProducts = () => {
    const params = new URLSearchParams();
    if (activeTab !== 'all') params.set('status', activeTab);
    if (search.trim()) params.set('search', search.trim());
    api.get(`/products/admin/all?${params}`)
      .then(res => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { setLoading(true); fetchProducts(); }, [activeTab]);

  const doPublish = async (id, e) => {
    e.stopPropagation();
    try { await api.patch(`/products/admin/${id}/publish`); fetchProducts(); showToast('Published'); }
    catch (err) { showToast(err.response?.data?.message || 'Cannot publish', 'error'); }
  };

  const doUnpublish = async (id, e) => {
    e.stopPropagation();
    try { await api.patch(`/products/admin/${id}/unpublish`); fetchProducts(); showToast('Set to draft'); }
    catch { showToast('Failed', 'error'); }
  };

  const doArchive = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Archive this product?')) return;
    try { await api.patch(`/products/admin/${id}/archive`); fetchProducts(); showToast('Archived'); }
    catch { showToast('Failed', 'error'); }
  };

  const doDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Permanently delete? Cannot be undone.')) return;
    try { await api.delete(`/products/admin/${id}`); fetchProducts(); showToast('Deleted'); }
    catch { showToast('Failed to delete', 'error'); }
  };

  return (
    <div className="p-4 p-lg-5">

      {/* Toast */}
      {toast.msg && (
        <div className={`position-fixed top-0 end-0 m-3 alert py-2 px-3 shadow-lg ${toast.type === 'error' ? 'alert-danger' : 'alert-dark'}`}
          style={{ zIndex: 9999, borderRadius: 12, fontSize: '0.875rem', minWidth: 220 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="d-flex align-items-start justify-content-between mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Products</h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>Manage product catalog, images, and publish status</p>
        </div>
        <button
          onClick={() => navigate('/admin/products/new')}
          className="btn btn-primary fw-semibold d-flex align-items-center gap-2"
          style={{ borderRadius: 10, padding: '9px 18px', flexShrink: 0 }}>
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> New Product
        </button>
      </div>

      {/* Filter tabs + search */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <div className="d-flex align-items-center justify-content-between px-3 border-bottom flex-wrap gap-2"
          style={{ minHeight: 52 }}>
          {/* Tabs */}
          <div className="d-flex">
            {STATUS_TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="btn btn-sm border-0 px-3 py-2 fw-semibold text-capitalize"
                style={{
                  borderRadius: 0,
                  borderBottom: `2px solid ${activeTab === tab ? '#3b82f6' : 'transparent'}`,
                  color: activeTab === tab ? '#3b82f6' : '#64748b',
                  fontSize: '0.875rem',
                  background: 'transparent',
                }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={e => { e.preventDefault(); setLoading(true); fetchProducts(); }}
            className="d-flex align-items-center gap-2 py-1">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="form-control form-control-sm"
              style={{ borderRadius: 8, width: 200 }} />
            <button type="submit" className="btn btn-sm btn-outline-secondary fw-semibold"
              style={{ borderRadius: 8 }}>Search</button>
          </form>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table table-hover mb-0" style={{ fontSize: '0.875rem' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th className="px-4 py-3 fw-semibold text-muted border-0" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</th>
                <th className="px-4 py-3 fw-semibold text-muted border-0" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Category</th>
                <th className="px-4 py-3 fw-semibold text-muted border-0" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Price</th>
                <th className="px-4 py-3 fw-semibold text-muted border-0" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Stock</th>
                <th className="px-4 py-3 fw-semibold text-muted border-0" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Images</th>
                <th className="px-4 py-3 fw-semibold text-muted border-0" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                <th className="px-4 py-3 fw-semibold text-muted border-0 text-end" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-5 text-muted">
                  <div className="spinner-border spinner-border-sm me-2 text-primary" />Loading...
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-5 text-muted">
                  <div style={{ fontSize: '2rem' }}>📦</div>
                  <p className="mt-2 mb-0">No products found</p>
                  <button onClick={() => navigate('/admin/products/new')}
                    className="btn btn-primary btn-sm mt-3" style={{ borderRadius: 8 }}>
                    + Add First Product
                  </button>
                </td></tr>
              ) : products.map(p => {
                const sc = statusConfig[p.status] || { bg: '#f1f5f9', color: '#64748b' };
                const imgOk = parseInt(p.image_count) >= 3;
                return (
                  <tr key={p.id} onClick={() => navigate(`/admin/products/${p.id}`)}
                    style={{ cursor: 'pointer' }}>
                    <td className="px-4 py-3 align-middle">
                      <p className="fw-semibold mb-0" style={{ color: '#0f172a' }}>{p.name}</p>
                      <p className="text-muted mb-0 font-monospace" style={{ fontSize: '0.75rem' }}>{p.slug}</p>
                    </td>
                    <td className="px-4 py-3 align-middle text-muted">{p.category || '—'}</td>
                    <td className="px-4 py-3 align-middle fw-semibold" style={{ color: '#1d4ed8' }}>
                      RM {parseFloat(p.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className={`fw-semibold ${p.stock > 0 ? '' : 'text-danger'}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="badge px-2 py-1" style={{
                        background: imgOk ? '#d1fae5' : '#fef3c7',
                        color: imgOk ? '#065f46' : '#92400e',
                        borderRadius: 6, fontSize: '0.75rem',
                      }}>
                        {p.image_count}/3 {imgOk ? '✓' : 'min'}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="badge px-2 py-1"
                        style={{ background: sc.bg, color: sc.color, borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle" onClick={e => e.stopPropagation()}>
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        <button onClick={() => navigate(`/admin/products/${p.id}`)}
                          className="btn btn-sm btn-outline-secondary"
                          style={{ borderRadius: 7, fontSize: '0.75rem', padding: '3px 10px' }}>
                          Edit
                        </button>
                        {p.status === 'draft' && (
                          <button onClick={e => doPublish(p.id, e)}
                            className="btn btn-sm btn-success"
                            style={{ borderRadius: 7, fontSize: '0.75rem', padding: '3px 10px' }}>
                            Publish
                          </button>
                        )}
                        {p.status === 'published' && (
                          <button onClick={e => doUnpublish(p.id, e)}
                            className="btn btn-sm btn-warning"
                            style={{ borderRadius: 7, fontSize: '0.75rem', padding: '3px 10px' }}>
                            Unpublish
                          </button>
                        )}
                        {p.status !== 'archived' && (
                          <button onClick={e => doArchive(p.id, e)}
                            className="btn btn-sm btn-outline-secondary"
                            style={{ borderRadius: 7, fontSize: '0.75rem', padding: '3px 10px' }}>
                            Archive
                          </button>
                        )}
                        <button onClick={e => doDelete(p.id, e)}
                          className="btn btn-sm btn-outline-danger"
                          style={{ borderRadius: 7, fontSize: '0.75rem', padding: '3px 10px' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
