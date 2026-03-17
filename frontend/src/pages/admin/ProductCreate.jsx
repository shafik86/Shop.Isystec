import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ProductCreate() {
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', stock: '', category_id: '',
  });
  const [images, setImages]       = useState([]); // [{ file, preview, base64 }]
  const [dragOver, setDragOver]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(console.error);
  }, []);

  const autoSlug = n => n.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // ── Image helpers ─────────────────────────────────────────────────────────

  const fileToBase64 = (file) => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(reader.result.split(',')[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

  const previewUrl = (file) => URL.createObjectURL(file);

  const addFiles = async (files) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!imgs.length) return;
    const entries = await Promise.all(
      imgs.map(async (file) => ({
        file,
        preview: previewUrl(file),
        base64: await fileToBase64(file),
      }))
    );
    setImages(prev => [...prev, ...entries]);
  };

  const removeImage = (idx) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.slug || !form.price) {
      setError('Name, slug, and price are required.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create product
      const res = await api.post('/products/admin/create', {
        ...form,
        category_id: form.category_id || null,
      });
      const productId = res.data.product.id;

      // 2. Upload images one by one
      for (let i = 0; i < images.length; i++) {
        await api.post(`/products/admin/${productId}/images`, {
          image_base64: images[i].base64,
        });
      }

      // 3. Navigate to edit page
      navigate(`/admin/products/${productId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product.');
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 p-lg-5">

      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button onClick={() => navigate('/admin/products')}
          className="btn btn-sm btn-light fw-semibold"
          style={{ borderRadius: 8 }}>
          ← Back
        </button>
        <div>
          <h2 className="fw-bold mb-0" style={{ color: '#0f172a' }}>New Product</h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>Fill in details and upload images</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4"
          style={{ borderRadius: 12 }}>
          <span>⚠️</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">

          {/* ── Left: Details ── */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4" style={{ color: '#0f172a' }}>Product Details</h5>

                {/* Name */}
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted" style={{ fontSize: '0.82rem' }}>
                    Product Name <span className="text-danger">*</span>
                  </label>
                  <input
                    required type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value, slug: autoSlug(e.target.value) })}
                    className="form-control"
                    placeholder="e.g. WildSec Motion Sensor Pro"
                    style={{ borderRadius: 10 }}
                  />
                </div>

                {/* Slug */}
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted" style={{ fontSize: '0.82rem' }}>
                    URL Slug <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text text-muted bg-light"
                      style={{ fontSize: '0.8rem', borderRadius: '10px 0 0 10px' }}>
                      /products/
                    </span>
                    <input
                      required type="text"
                      value={form.slug}
                      onChange={e => setForm({ ...form, slug: e.target.value })}
                      className="form-control font-monospace"
                      style={{ borderRadius: '0 10px 10px 0' }}
                    />
                  </div>
                  <div className="d-flex justify-content-end mt-1">
                    <button type="button"
                      onClick={() => setForm({ ...form, slug: autoSlug(form.name) })}
                      className="btn btn-sm btn-link text-primary p-0"
                      style={{ fontSize: '0.78rem' }}>
                      Auto-generate from name
                    </button>
                  </div>
                </div>

                {/* Price + Stock */}
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold text-muted" style={{ fontSize: '0.82rem' }}>
                      Price (RM) <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted"
                        style={{ borderRadius: '10px 0 0 10px', fontSize: '0.85rem' }}>RM</span>
                      <input
                        required type="number" step="0.01" min="0"
                        value={form.price}
                        onChange={e => setForm({ ...form, price: e.target.value })}
                        className="form-control"
                        placeholder="0.00"
                        style={{ borderRadius: '0 10px 10px 0' }}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold text-muted" style={{ fontSize: '0.82rem' }}>
                      Stock <span className="text-danger">*</span>
                    </label>
                    <input
                      required type="number" min="0"
                      value={form.stock}
                      onChange={e => setForm({ ...form, stock: e.target.value })}
                      className="form-control"
                      placeholder="0"
                      style={{ borderRadius: 10 }}
                    />
                    {form.stock !== '' && parseInt(form.stock) === 0 && (
                      <p className="text-warning mb-0 mt-1" style={{ fontSize: '0.75rem' }}>
                        ⚠ Stock 0 — cannot publish
                      </p>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted" style={{ fontSize: '0.82rem' }}>Category</label>
                  <select
                    value={form.category_id}
                    onChange={e => setForm({ ...form, category_id: e.target.value })}
                    className="form-select"
                    style={{ borderRadius: 10 }}>
                    <option value="">— No Category —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Description */}
                <div className="mb-0">
                  <label className="form-label fw-semibold text-muted" style={{ fontSize: '0.82rem' }}>Description</label>
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="form-control"
                    placeholder="Write a detailed product description...&#10;&#10;• Key features&#10;• Specifications&#10;• What's in the box"
                    style={{ borderRadius: 10, resize: 'vertical', lineHeight: 1.6 }}
                  />
                  <p className="text-end text-muted mb-0 mt-1" style={{ fontSize: '0.75rem' }}>
                    {form.description.length} characters
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Images ── */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h5 className="fw-bold mb-0" style={{ color: '#0f172a' }}>Product Images</h5>
                    <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
                      Minimum 3 images required to publish
                    </p>
                  </div>
                  <span className={`badge px-3 py-2`}
                    style={{
                      background: images.length >= 3 ? '#d1fae5' : '#fef3c7',
                      color: images.length >= 3 ? '#065f46' : '#92400e',
                      borderRadius: 20, fontSize: '0.8rem',
                    }}>
                    {images.length} / 3 min
                  </span>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                  onClick={() => fileInputRef.current.click()}
                  className="text-center rounded-3 mb-3"
                  style={{
                    border: `2px dashed ${dragOver ? '#3b82f6' : '#cbd5e1'}`,
                    background: dragOver ? '#eff6ff' : '#f8fafc',
                    padding: '28px 20px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="d-none"
                    onChange={e => addFiles(e.target.files)}
                  />
                  <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>📤</div>
                  <p className="fw-semibold mb-1" style={{ color: '#374151', fontSize: '0.9rem' }}>
                    Drop images here or click to browse
                  </p>
                  <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>
                    JPG, PNG, WebP — multiple files supported
                  </p>
                </div>

                {/* Preview grid */}
                {images.length > 0 && (
                  <div className="row g-2">
                    {images.map((img, i) => (
                      <div key={i} className="col-4">
                        <div className="position-relative rounded-3 overflow-hidden"
                          style={{ paddingBottom: '100%', background: '#f1f5f9' }}>
                          <img
                            src={img.preview}
                            alt={`Preview ${i + 1}`}
                            style={{
                              position: 'absolute', inset: 0,
                              width: '100%', height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          {/* Position badge */}
                          <span className="position-absolute top-0 start-0 m-1 badge"
                            style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 6, fontSize: '0.7rem' }}>
                            #{i + 1}
                          </span>
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="position-absolute top-0 end-0 m-1 btn btn-sm d-flex align-items-center justify-content-center"
                            style={{
                              width: 24, height: 24, padding: 0,
                              background: '#ef4444', color: '#fff',
                              borderRadius: '50%', border: 'none',
                              fontSize: '0.75rem', lineHeight: 1,
                            }}>
                            ✕
                          </button>
                        </div>
                        <p className="text-muted text-center mt-1 mb-0"
                          style={{ fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {img.file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {images.length === 0 && (
                  <p className="text-center text-muted mt-1 mb-0" style={{ fontSize: '0.8rem' }}>
                    No images selected yet
                  </p>
                )}
              </div>
            </div>

            {/* Publish checklist info */}
            <div className="card border-0 mt-3" style={{ borderRadius: 12, background: '#f0f9ff', border: '1px solid #bae6fd !important' }}>
              <div className="card-body p-3">
                <p className="fw-semibold mb-2" style={{ fontSize: '0.82rem', color: '#0369a1' }}>
                  📋 Publish Requirements
                </p>
                <div className="d-flex flex-column gap-1">
                  {[
                    { label: 'Stock greater than 0', ok: parseInt(form.stock) > 0 },
                    { label: `Minimum 3 images (${images.length} added)`, ok: images.length >= 3 },
                  ].map(item => (
                    <div key={item.label} className="d-flex align-items-center gap-2"
                      style={{ fontSize: '0.8rem', color: item.ok ? '#065f46' : '#64748b' }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: '50%', display: 'inline-flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem',
                        background: item.ok ? '#d1fae5' : '#e2e8f0',
                        color: item.ok ? '#065f46' : '#94a3b8',
                        flexShrink: 0,
                      }}>
                        {item.ok ? '✓' : '✗'}
                      </span>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit bar */}
        <div className="card border-0 shadow-sm mt-4" style={{ borderRadius: 14 }}>
          <div className="card-body px-4 py-3 d-flex align-items-center justify-content-between gap-3">
            <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
              Product will be saved as <strong>Draft</strong>. You can publish after adding all required content.
            </p>
            <div className="d-flex gap-2 flex-shrink-0">
              <button type="button" onClick={() => navigate('/admin/products')}
                className="btn btn-light fw-semibold"
                style={{ borderRadius: 10, padding: '10px 20px' }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="btn btn-primary fw-semibold"
                style={{ borderRadius: 10, padding: '10px 24px' }}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    {images.length > 0 ? 'Creating & uploading images...' : 'Creating product...'}
                  </>
                ) : (
                  `Create Product${images.length > 0 ? ` + ${images.length} image${images.length > 1 ? 's' : ''}` : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
