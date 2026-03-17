import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ orders: 0, products: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/orders/admin').catch(() => ({ data: [] })),
      api.get('/products').catch(() => ({ data: [] }))
    ]).then(([orders, products]) => {
      setStats({ orders: orders.data.length, products: products.data.length });
    });
  }, []);

  const cards = [
    { label: 'Total Orders', value: stats.orders, link: '/admin/orders', color: 'bg-blue-50 text-blue-700' },
    { label: 'Published Products', value: stats.products, link: '/admin/products', color: 'bg-green-50 text-green-700' }
  ];

  const menus = [
    { label: 'Products', path: '/admin/products', desc: 'Manage product catalog' },
    { label: 'Categories', path: '/admin/categories', desc: 'Manage categories' },
    { label: 'Orders', path: '/admin/orders', desc: 'View and manage orders' },
    { label: 'Vouchers', path: '/admin/vouchers', desc: 'Create and manage vouchers' },
    { label: 'Payment Gateways', path: '/admin/payment-gateways', desc: 'Enable or disable payment methods' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {cards.map(c => (
          <Link key={c.label} to={c.link} className={`rounded-xl p-6 ${c.color} hover:opacity-90`}>
            <p className="text-3xl font-bold mb-1">{c.value}</p>
            <p className="text-sm font-medium">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menus.map(m => (
          <Link
            key={m.label}
            to={m.path}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-gray-900 mb-1">{m.label}</h3>
            <p className="text-sm text-gray-500">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
