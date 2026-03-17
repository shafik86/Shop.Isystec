import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const statusBadge = {
  published: 'bg-green-100 text-green-700',
  draft:     'bg-yellow-100 text-yellow-700',
  archived:  'bg-gray-200 text-gray-500',
};

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const [product,    setProduct]    = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', stock: '', category_id: '',
  });

  const [saving,     setSaving]    = useState(false);
  const [uploading,  setUploading] = useState(false);
  const [dragOver,   setDragOver]  = useState(false);
  const [toast,      setToast]     = useState({ msg: '', type: 'success' });
  const [activeTab,  setActiveTab] = useState('details');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchProduct = async () => {
    const res = await api.get(`/products/admin/${id}`);
    const p = res.data;
    setProduct(p);
    setForm({
      name:        p.name        ?? '',
      slug:        p.slug        ?? '',
      description: p.description ?? '',
      price:       p.price       ?? '',
      stock:       p.stock       ?? 0,
      category_id: p.category_id ?? '',
    });
    return p;
  };

  useEffect(() => {
    Promise.all([
      fetchProduct(),
      api.get('/categories').then(r => setCategories(r.data)),
    ])
      .catch(err => {
        const msg = err.response?.data?.message || err.message || 'Failed to load product';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const autoSlug = n => n.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // ─── Save Details ─────────────────────────────────────────────────────────

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/products/admin/${id}`, {
        ...form,
        category_id: form.category_id || null,
      });
      showToast('Changes saved');
      await fetchProduct();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Status ───────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    try {
      await api.patch(`/products/admin/${id}/publish`);
      showToast('Product published');
      await fetchProduct();
    } catch (err) {
      showToast(err.response?.data?.message || 'Cannot publish', 'error');
    }
  };

  const handleUnpublish = async () => {
    try {
      await api.patch(`/products/admin/${id}/unpublish`);
      showToast('Product set to draft');
      await fetchProduct();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
    }
  };

  const handleArchive = async () => {
    if (!confirm('Archive this product?')) return;
    try {
      await api.patch(`/products/admin/${id}/archive`);
      showToast('Product archived');
      await fetchProduct();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirm('DELETE permanently? Cannot be undone.')) return;
    try {
      await api.delete(`/products/admin/${id}`);
      navigate('/admin/products');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  // ─── Images ───────────────────────────────────────────────────────────────

  const fileToBase64 = file => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(reader.result.split(',')[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

  const uploadFiles = async (files) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!imgs.length) return;
    setUploading(true);
    try {
      for (const file of imgs) {
        const b64 = await fileToBase64(file);
        await api.post(`/products/admin/${id}/images`, { image_base64: b64 });
      }
      showToast(`${imgs.length} image(s) uploaded`);
      await fetchProduct();
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imgId) => {
    if (!confirm('Delete this image?')) return;
    try {
      await api.delete(`/products/admin/images/${imgId}`);
      showToast('Image deleted');
      await fetchProduct();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-sm">Loading product...</p>
    </div>
  );

  if (error) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium mb-3">{error}</p>
        <button onClick={() => navigate('/admin/products')} className="text-sm text-blue-600 hover:underline">
          ← Back to Products
        </button>
      </div>
    </div>
  );

  const imageCount = product?.images?.length ?? 0;
  const canPublish = (product?.stock ?? 0) > 0 && imageCount >= 3;

  const TABS = [
    { key: 'details', label: '📝 Details' },
    { key: 'images',  label: `🖼️ Images (${imageCount})` },
    { key: 'danger',  label: '🗑️ Danger Zone' },
  ];

  return (
    <div className="p-6 max-w-4xl">

      {/* Toast */}
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
        }`}>
          <span>{toast.type === 'error' ? '✕' : '✓'}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <button onClick={() => navigate('/admin/products')}
            className="text-sm text-gray-400 hover:text-gray-600 mb-1.5 flex items-center gap-1">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge[product.status]}`}>
              {product.status}
            </span>
            <span className="text-xs text-gray-400">
              {imageCount} image{imageCount !== 1 ? 's' : ''}
              {imageCount < 3 && (
                <span className="text-orange-500 ml-1">• need {3 - imageCount} more to publish</span>
              )}
            </span>
            {product.category_name && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {product.category_name}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {product.status === 'draft' && (
            <button onClick={handlePublish} disabled={!canPublish}
              title={!canPublish ? 'Stock > 0 and at least 3 images required' : 'Publish to store'}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed">
              Publish
            </button>
          )}
          {product.status === 'published' && (
            <button onClick={handleUnpublish}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600">
              Unpublish
            </button>
          )}
          {product.status !== 'archived' && (
            <button onClick={handleArchive}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
              Archive
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: DETAILS ══ */}
      {activeTab === 'details' && (
        <form onSubmit={handleSave}>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

            {/* Name */}
            <div className="p-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Product Name *
              </label>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. WildSec Motion Sensor Pro"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Slug */}
            <div className="p-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                URL Slug *
              </label>
              <div className="flex gap-2">
                <span className="flex items-center text-sm text-gray-400 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg px-3 whitespace-nowrap">
                  /products/
                </span>
                <input
                  required
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-r-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button"
                  onClick={() => setForm({ ...form, slug: autoSlug(form.name) })}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 whitespace-nowrap">
                  Auto-generate
                </button>
              </div>
            </div>

            {/* Price + Stock */}
            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Price (RM) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">RM</span>
                  <input
                    required type="number" step="0.01" min="0"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Stock *
                </label>
                <input
                  required type="number" min="0"
                  value={form.stock}
                  onChange={e => setForm({ ...form, stock: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    parseInt(form.stock) === 0 ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                  }`}
                />
                {parseInt(form.stock) === 0 && (
                  <p className="text-xs text-orange-500 mt-1">⚠ Stock 0 — cannot publish</p>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="p-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={form.category_id}
                onChange={e => setForm({ ...form, category_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">— No Category —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="p-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                rows={6}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Write a detailed product description here...&#10;&#10;• Features&#10;• Specifications&#10;• What's in the box"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y leading-relaxed"
              />
              <p className="text-xs text-gray-400 mt-1">{form.description.length} characters</p>
            </div>
          </div>

          {/* Save bar */}
          <div className="flex items-center justify-between mt-4 bg-white rounded-xl border border-gray-200 px-5 py-3">
            <p className="text-xs text-gray-400">
              Last updated: {product.updated_at
                ? new Date(product.updated_at).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })
                : '—'}
            </p>
            <button type="submit" disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {saving ? (
                <><span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ══ TAB: IMAGES ══ */}
      {activeTab === 'images' && (
        <div className="space-y-4">

          {/* Checklist */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Publish Requirements</p>
            <div className="flex items-center gap-6">
              {[
                { label: 'Stock > 0', ok: (product?.stock ?? 0) > 0 },
                { label: `Min 3 images (${imageCount} / 3)`, ok: imageCount >= 3 },
              ].map(item => (
                <div key={item.label} className={`flex items-center gap-2 text-sm font-medium ${item.ok ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${item.ok ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {item.ok ? '✓' : '✗'}
                  </span>
                  {item.label}
                </div>
              ))}
              {canPublish && product.status === 'draft' && (
                <button onClick={handlePublish}
                  className="ml-auto bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700">
                  Publish Now
                </button>
              )}
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
            onClick={() => !uploading && fileInputRef.current.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              dragOver   ? 'border-blue-500 bg-blue-50 scale-[1.01]' :
              uploading  ? 'border-blue-300 bg-blue-50 cursor-wait' :
                           'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => uploadFiles(e.target.files)} />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-blue-600 text-sm font-medium">Uploading images...</p>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-3">📤</div>
                <p className="text-sm font-semibold text-gray-700">Drop images here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP • Multiple files • Max 10MB each</p>
              </>
            )}
          </div>

          {/* Image grid */}
          {imageCount === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <p className="text-gray-400 text-sm">No images yet</p>
              <p className="text-gray-300 text-xs mt-1">Upload at least 3 images to be able to publish</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {product.images.map((img, i) => (
                <div key={img.id} className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  {/* Badge */}
                  <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    #{i + 1}
                  </div>
                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    className="absolute top-2 right-2 z-10 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow">
                    ✕
                  </button>
                  <img
                    src={`data:image/jpeg;base64,${img.image_base64}`}
                    alt={`Product image ${i + 1}`}
                    className="w-full h-36 object-cover"
                  />
                  <div className="px-2 py-1.5 text-xs text-gray-400 text-center border-t border-gray-100">
                    Position {img.position}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: DANGER ZONE ══ */}
      {activeTab === 'danger' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Archive Product</h3>
            <p className="text-sm text-gray-500 mb-4">
              Sembunyikan product dari store. Stock dan data masih tersimpan.
            </p>
            <button onClick={handleArchive} disabled={product.status === 'archived'}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-40">
              {product.status === 'archived' ? 'Already Archived' : 'Archive Product'}
            </button>
          </div>

          <div className="bg-red-50 rounded-xl border border-red-200 p-6">
            <h3 className="font-semibold text-red-700 mb-1">Delete Product</h3>
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete product beserta <strong>semua images</strong>. Tindakan ini <strong>tidak boleh dibatalkan</strong>.
            </p>
            <button onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">
              Delete Permanently
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
