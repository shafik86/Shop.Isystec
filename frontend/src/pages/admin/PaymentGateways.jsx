import { useState, useEffect } from 'react';
import api from '../../services/api';

// Config fields definition per gateway
const GATEWAY_CONFIG = {
  stripe: {
    label: 'Stripe',
    desc: 'Credit / Debit Card (International)',
    color: 'bg-indigo-50 border-indigo-200',
    icon: '💳',
    fields: [
      { key: 'publishable_key', label: 'Publishable Key', placeholder: 'pk_live_...', sensitive: false, hint: 'Safe to expose to frontend' },
      { key: 'secret_key', label: 'Secret Key', placeholder: 'sk_live_...', sensitive: true, hint: 'Never expose this publicly' },
      { key: 'webhook_secret', label: 'Webhook Signing Secret', placeholder: 'whsec_...', sensitive: true, hint: 'From Stripe Dashboard → Webhooks' },
    ]
  },
  senangpay: {
    label: 'SenangPay',
    desc: 'FPX / Card (Malaysia)',
    color: 'bg-orange-50 border-orange-200',
    icon: '🏦',
    fields: [
      { key: 'merchant_id', label: 'Merchant ID', placeholder: '12345', sensitive: false, hint: 'From SenangPay Dashboard' },
      { key: 'secret_key', label: 'Secret Key / Hash', placeholder: 'your-secret-key', sensitive: true, hint: 'Used to generate MD5 hash for verification' },
      { key: 'callback_url', label: 'Return URL / Callback URL', placeholder: 'https://yourdomain.com/payment/senangpay/callback', sensitive: false, hint: 'Set this URL in SenangPay Dashboard' },
    ]
  },
  billplz: {
    label: 'Billplz',
    desc: 'Online Banking FPX (Malaysia)',
    color: 'bg-teal-50 border-teal-200',
    icon: '🏧',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'your-api-key', sensitive: true, hint: 'From Billplz Account Settings → API' },
      { key: 'collection_id', label: 'Collection ID', placeholder: 'abc123', sensitive: false, hint: 'Your Billplz collection to receive payments' },
      { key: 'x_signature_key', label: 'X-Signature Key', placeholder: 'your-signature-key', sensitive: true, hint: 'Used for webhook signature verification' },
      { key: 'callback_url', label: 'Callback URL', placeholder: 'https://yourdomain.com/payment/billplz/callback', sensitive: false, hint: 'Set this URL in Billplz Account Settings' },
    ]
  }
};

function GatewayCard({ gateway, onToggle, toggling }) {
  const meta = GATEWAY_CONFIG[gateway.name] || { label: gateway.name, desc: '', fields: [], icon: '💰', color: 'bg-gray-50 border-gray-200' };
  const [expanded, setExpanded] = useState(false);
  const [config, setConfig] = useState({});
  const [form, setForm] = useState({});
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [showValues, setShowValues] = useState({});

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchConfig = () => {
    setLoadingConfig(true);
    api.get(`/payment/admin/${gateway.name}/config`)
      .then(res => {
        setConfig(res.data);
        // Pre-fill form with existing values
        const initial = {};
        meta.fields.forEach(f => {
          initial[f.key] = res.data[f.key] || '';
        });
        setForm(initial);
      })
      .catch(console.error)
      .finally(() => setLoadingConfig(false));
  };

  const handleExpand = () => {
    if (!expanded) fetchConfig();
    setExpanded(!expanded);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/payment/admin/${gateway.name}/config`, form);
      showToast('Configuration saved');
      fetchConfig();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleShow = (key) => {
    setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasConfig = meta.fields.some(f => config[f.key]);

  return (
    <div className={`bg-white rounded-xl border ${expanded ? 'border-blue-300 shadow-md' : 'border-gray-200'} overflow-hidden transition-all`}>
      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{meta.label}</h3>
              {hasConfig && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Configured</span>
              )}
            </div>
            <p className="text-sm text-gray-500">{meta.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${gateway.is_enabled ? 'text-green-600' : 'text-gray-400'}`}>
              {gateway.is_enabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={() => onToggle(gateway.name)}
              disabled={toggling === gateway.name}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                gateway.is_enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                gateway.is_enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Expand Config */}
          <button
            onClick={handleExpand}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              expanded
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <span>⚙️</span>
            <span>{expanded ? 'Hide' : 'Configure'}</span>
          </button>
        </div>
      </div>

      {/* Config Panel */}
      {expanded && (
        <div className={`border-t border-gray-100 ${meta.color} px-5 py-5`}>
          {toast && (
            <div className="bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg mb-4">
              {toast}
            </div>
          )}

          {loadingConfig ? (
            <p className="text-sm text-gray-400 py-4 text-center">Loading configuration...</p>
          ) : (
            <form onSubmit={handleSave}>
              <p className="text-xs text-gray-500 mb-4">
                Nilai yang tidak diubah tidak akan terjejas. Kosongkan field untuk skip.
              </p>

              <div className="space-y-4">
                {meta.fields.map(field => (
                  <div key={field.key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        {field.label}
                        {field.sensitive && (
                          <span className="ml-1.5 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded normal-case font-normal tracking-normal">
                            sensitive
                          </span>
                        )}
                      </label>
                      {config[field.key] && (
                        <span className="text-xs text-green-600">✓ Saved</span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type={field.sensitive && !showValues[field.key] ? 'password' : 'text'}
                        value={form[field.key] || ''}
                        onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                        placeholder={config[field.key] ? '••••••••  (leave blank to keep existing)' : field.placeholder}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      />
                      {field.sensitive && (
                        <button
                          type="button"
                          onClick={() => toggleShow(field.key)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                        >
                          {showValues[field.key] ? '🙈' : '👁️'}
                        </button>
                      )}
                    </div>

                    {field.hint && (
                      <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/60">
                <a
                  href={
                    gateway.name === 'stripe' ? 'https://dashboard.stripe.com/apikeys' :
                    gateway.name === 'senangpay' ? 'https://app.senangpay.my/account' :
                    'https://www.billplz.com/enterprise/settings'
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Open {meta.label} Dashboard →
                </a>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPaymentGateways() {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState('');

  const fetchGateways = () => {
    api.get('/payment/admin')
      .then(res => setGateways(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGateways(); }, []);

  const toggle = async (name) => {
    setToggling(name);
    try {
      await api.patch(`/payment/admin/${name}/toggle`);
      fetchGateways();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle');
    } finally {
      setToggling('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Gateways</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enable/disable gateways dan configure API keys untuk setiap payment provider.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
        <span className="text-lg shrink-0">⚠️</span>
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">Security Notice</p>
          <p>API keys dan secret keys ini disimpan dalam database. Pastikan server anda selamat dan akses admin dihadkan kepada pengguna yang dipercayai sahaja.</p>
        </div>
      </div>

      <div className="space-y-4">
        {gateways.map(g => (
          <GatewayCard
            key={g.name}
            gateway={g}
            onToggle={toggle}
            toggling={toggling}
          />
        ))}
      </div>
    </div>
  );
}
