const pool = require('../config/db');

const generateOrderNumber = () => {
  const ts = Date.now().toString();
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${ts}-${rand}`;
};

exports.createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { payment_method, voucher_code } = req.body;

    if (!payment_method) {
      return res.status(400).json({ message: 'payment_method is required' });
    }

    // Get user cart
    const cartResult = await client.query(
      'SELECT id FROM carts WHERE user_id = $1',
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const cartId = cartResult.rows[0].id;

    const items = await client.query(`
      SELECT ci.id, ci.qty, p.id AS product_id, p.name, p.price, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = $1
    `, [cartId]);

    if (items.rows.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate stock
    for (const item of items.rows) {
      if (item.stock < item.qty) {
        return res.status(400).json({
          message: `Insufficient stock for "${item.name}"`
        });
      }
    }

    let total = items.rows.reduce((sum, i) => sum + (parseFloat(i.price) * i.qty), 0);
    let discountAmount = 0;
    let voucherId = null;

    // Apply voucher if provided
    if (voucher_code) {
      const voucher = await client.query(`
        SELECT v.id, v.discount_type, v.discount_value, v.usage_limit, v.expiry_date, v.status,
               COUNT(vu.id) AS used_count
        FROM vouchers v
        LEFT JOIN voucher_usage vu ON v.id = vu.voucher_id
        WHERE v.code = $1
        GROUP BY v.id
      `, [voucher_code]);

      if (voucher.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid voucher code' });
      }

      const v = voucher.rows[0];

      if (v.status !== 'active') {
        return res.status(400).json({ message: 'Voucher is not active' });
      }

      if (v.expiry_date && new Date(v.expiry_date) < new Date()) {
        return res.status(400).json({ message: 'Voucher has expired' });
      }

      if (v.usage_limit && parseInt(v.used_count) >= v.usage_limit) {
        return res.status(400).json({ message: 'Voucher usage limit reached' });
      }

      if (v.discount_type === 'percent') {
        discountAmount = total * (parseFloat(v.discount_value) / 100);
      } else {
        discountAmount = parseFloat(v.discount_value);
      }

      total = Math.max(0, total - discountAmount);
      voucherId = v.id;
    }

    await client.query('BEGIN');

    // Create order
    const order = await client.query(`
      INSERT INTO orders (order_number, user_id, total_price, payment_method, payment_status, order_status)
      VALUES ($1, $2, $3, $4, 'pending', 'pending')
      RETURNING *
    `, [generateOrderNumber(), req.user.id, total, payment_method]);

    const orderId = order.rows[0].id;

    // Create order items + deduct stock
    for (const item of items.rows) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, price, qty)
        VALUES ($1, $2, $3, $4)
      `, [orderId, item.product_id, item.price, item.qty]);

      await client.query(`
        UPDATE products SET stock = stock - $1 WHERE id = $2
      `, [item.qty, item.product_id]);
    }

    // Record voucher usage
    if (voucherId) {
      await client.query(`
        INSERT INTO voucher_usage (voucher_id, user_id, order_id)
        VALUES ($1, $2, $3)
      `, [voucherId, req.user.id, orderId]);
    }

    // Clear cart
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order created',
      order: order.rows[0],
      discount: discountAmount
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, order_number, total_price, payment_method, payment_status, order_status, created_at
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await pool.query(`
      SELECT id, order_number, total_price, payment_method, payment_status, order_status, created_at
      FROM orders
      WHERE id = $1 AND user_id = $2
    `, [id, req.user.id]);

    if (order.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const items = await pool.query(`
      SELECT oi.qty, oi.price, p.name, p.slug
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [id]);

    res.json({ ...order.rows[0], items: items.rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin
exports.getAllOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.id, o.order_number, o.total_price, o.payment_method,
             o.payment_status, o.order_status, o.created_at,
             u.name AS customer_name, u.email AS customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status, payment_status } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (order_status) { fields.push(`order_status = $${idx++}`); values.push(order_status); }
    if (payment_status) { fields.push(`payment_status = $${idx++}`); values.push(payment_status); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE orders SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order updated', order: result.rows[0] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAdminOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await pool.query(`
      SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `, [id]);

    if (order.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const items = await pool.query(`
      SELECT oi.qty, oi.price, p.name, p.slug
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [id]);

    res.json({ ...order.rows[0], items: items.rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
