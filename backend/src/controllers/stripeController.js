const pool = require('../config/db');
const stripe = require('stripe');

async function getStripeConfig() {
  const res = await pool.query(
    "SELECT config_key, config_value FROM payment_gateway_config WHERE gateway = 'stripe'"
  );
  const config = {};
  res.rows.forEach(r => { config[r.config_key] = r.config_value; });
  if (!config.secret_key) throw new Error('Stripe secret key not configured in admin panel');
  return config;
}

exports.createPaymentIntent = async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ message: 'order_id required' });

    // Verify order belongs to user and is pending payment
    const orderRes = await pool.query(
      'SELECT id, total_price, payment_status FROM orders WHERE id = $1 AND user_id = $2',
      [order_id, req.user.id]
    );
    if (orderRes.rows.length === 0) return res.status(404).json({ message: 'Order not found' });

    const order = orderRes.rows[0];
    if (order.payment_status === 'paid') {
      return res.status(400).json({ message: 'Order already paid' });
    }

    const config = await getStripeConfig();
    const stripeClient = stripe(config.secret_key);

    const amountCents = Math.round(parseFloat(order.total_price) * 100);

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amountCents,
      currency: 'myr',
      metadata: { order_id },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      publishable_key: config.publishable_key,
    });

  } catch (err) {
    console.error('Stripe createPaymentIntent error:', err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { order_id, payment_intent_id } = req.body;
    if (!order_id || !payment_intent_id) {
      return res.status(400).json({ message: 'order_id and payment_intent_id required' });
    }

    // Verify order belongs to user
    const orderRes = await pool.query(
      'SELECT id, total_price FROM orders WHERE id = $1 AND user_id = $2',
      [order_id, req.user.id]
    );
    if (orderRes.rows.length === 0) return res.status(404).json({ message: 'Order not found' });

    const config = await getStripeConfig();
    const stripeClient = stripe(config.secret_key);

    // Retrieve and verify the PaymentIntent from Stripe
    const intent = await stripeClient.paymentIntents.retrieve(payment_intent_id);

    if (intent.status !== 'succeeded') {
      return res.status(400).json({ message: `Payment not completed. Status: ${intent.status}` });
    }

    if (intent.metadata.order_id !== order_id) {
      return res.status(400).json({ message: 'Payment intent does not match this order' });
    }

    // Update order status
    await pool.query(
      "UPDATE orders SET payment_status = 'paid', order_status = 'processing' WHERE id = $1",
      [order_id]
    );

    // Record payment in payments table
    await pool.query(`
      INSERT INTO payments (order_id, gateway, transaction_id, amount, status, raw_response)
      VALUES ($1, 'stripe', $2, $3, 'paid', $4)
    `, [order_id, payment_intent_id, intent.amount / 100, JSON.stringify(intent)]);

    res.json({ message: 'Payment confirmed', order_id });

  } catch (err) {
    console.error('Stripe confirmPayment error:', err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};
