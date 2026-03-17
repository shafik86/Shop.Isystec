const pool = require('../config/db');

exports.createVoucher = async (req, res) => {
  try {
    const { code, discount_type, discount_value, usage_limit, expiry_date } = req.body;

    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ message: 'code, discount_type, and discount_value are required' });
    }

    if (!['percent', 'amount'].includes(discount_type)) {
      return res.status(400).json({ message: 'discount_type must be "percent" or "amount"' });
    }

    const result = await pool.query(`
      INSERT INTO vouchers (code, discount_type, discount_value, usage_limit, expiry_date, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING *
    `, [code.toUpperCase(), discount_type, discount_value, usage_limit || null, expiry_date || null]);

    res.status(201).json({ message: 'Voucher created', voucher: result.rows[0] });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Voucher code already exists' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getVouchers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, COUNT(vu.id) AS used_count
      FROM vouchers v
      LEFT JOIN voucher_usage vu ON v.id = vu.voucher_id
      GROUP BY v.id
      ORDER BY v.code
    `);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateVoucherStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'status must be "active" or "inactive"' });
    }

    const result = await pool.query(
      'UPDATE vouchers SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    res.json({ message: 'Voucher updated', voucher: result.rows[0] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.validateVoucher = async (req, res) => {
  try {
    const { code } = req.params;

    const voucher = await pool.query(`
      SELECT v.id, v.code, v.discount_type, v.discount_value, v.usage_limit, v.expiry_date, v.status,
             COUNT(vu.id) AS used_count
      FROM vouchers v
      LEFT JOIN voucher_usage vu ON v.id = vu.voucher_id
      WHERE v.code = $1
      GROUP BY v.id
    `, [code.toUpperCase()]);

    if (voucher.rows.length === 0) {
      return res.status(404).json({ valid: false, message: 'Invalid voucher code' });
    }

    const v = voucher.rows[0];

    if (v.status !== 'active') {
      return res.json({ valid: false, message: 'Voucher is not active' });
    }

    if (v.expiry_date && new Date(v.expiry_date) < new Date()) {
      return res.json({ valid: false, message: 'Voucher has expired' });
    }

    if (v.usage_limit && parseInt(v.used_count) >= v.usage_limit) {
      return res.json({ valid: false, message: 'Voucher usage limit reached' });
    }

    res.json({
      valid: true,
      discount_type: v.discount_type,
      discount_value: v.discount_value,
      message: `Voucher valid: ${v.discount_type === 'percent' ? v.discount_value + '%' : 'RM' + v.discount_value} off`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
