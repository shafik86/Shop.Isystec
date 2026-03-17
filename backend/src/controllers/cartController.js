const pool = require('../config/db');

const getOrCreateCart = async (userId) => {
  let cart = await pool.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (cart.rows.length === 0) {
    cart = await pool.query(
      'INSERT INTO carts (user_id) VALUES ($1) RETURNING id',
      [userId]
    );
  }
  return cart.rows[0].id;
};

exports.getCart = async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);

    const items = await pool.query(`
      SELECT
        ci.id,
        ci.qty,
        p.id AS product_id,
        p.name,
        p.price,
        p.stock,
        (ci.qty * p.price) AS subtotal
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = $1
      ORDER BY ci.created_at
    `, [cartId]);

    const total = items.rows.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);

    res.json({ cart_id: cartId, items: items.rows, total });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { product_id, qty = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({ message: 'product_id is required' });
    }

    const product = await pool.query(
      "SELECT id, stock FROM products WHERE id = $1 AND status = 'published'",
      [product_id]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.rows[0].stock < qty) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const cartId = await getOrCreateCart(req.user.id);

    const existing = await pool.query(
      'SELECT id, qty FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, product_id]
    );

    if (existing.rows.length > 0) {
      const newQty = existing.rows[0].qty + qty;
      if (product.rows[0].stock < newQty) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      await pool.query(
        'UPDATE cart_items SET qty = $1 WHERE id = $2',
        [newQty, existing.rows[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO cart_items (cart_id, product_id, qty) VALUES ($1, $2, $3)',
        [cartId, product_id, qty]
      );
    }

    res.json({ message: 'Item added to cart' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { qty } = req.body;

    if (!qty || qty < 1) {
      return res.status(400).json({ message: 'qty must be at least 1' });
    }

    const item = await pool.query(`
      SELECT ci.id, ci.product_id, p.stock
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      JOIN products p ON ci.product_id = p.id
      WHERE ci.id = $1 AND c.user_id = $2
    `, [id, req.user.id]);

    if (item.rows.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    if (item.rows[0].stock < qty) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    await pool.query('UPDATE cart_items SET qty = $1 WHERE id = $2', [qty, id]);
    res.json({ message: 'Cart updated' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      DELETE FROM cart_items ci
      USING carts c
      WHERE ci.cart_id = c.id AND ci.id = $1 AND c.user_id = $2
      RETURNING ci.id
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
