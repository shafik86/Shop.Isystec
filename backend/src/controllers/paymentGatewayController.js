const pool = require('../config/db');

exports.getMethods = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT name, is_enabled AS enabled
      FROM payment_gateways
      WHERE is_enabled = true
      ORDER BY name
    `);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllGateways = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, is_enabled, created_at
      FROM payment_gateways
      ORDER BY name
    `);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getGatewayConfig = async (req, res) => {
  try {
    const { name } = req.params;

    const result = await pool.query(`
      SELECT config_key, config_value
      FROM payment_gateway_config
      WHERE gateway = $1
      ORDER BY config_key
    `, [name]);

    // Return as key-value object
    const config = {};
    result.rows.forEach(row => {
      config[row.config_key] = row.config_value;
    });

    res.json(config);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.saveGatewayConfig = async (req, res) => {
  const client = await pool.connect();
  try {
    const { name } = req.params;
    const config = req.body; // { key: value, ... }

    if (typeof config !== 'object' || Array.isArray(config)) {
      return res.status(400).json({ message: 'Body must be a key-value object' });
    }

    await client.query('BEGIN');

    for (const [key, value] of Object.entries(config)) {
      // Skip empty strings — treat as "no change"
      if (value === '' || value === null || value === undefined) continue;

      await client.query(`
        INSERT INTO payment_gateway_config (gateway, config_key, config_value)
        VALUES ($1, $2, $3)
        ON CONFLICT (gateway, config_key)
        DO UPDATE SET config_value = EXCLUDED.config_value
      `, [name, key, value]);
    }

    await client.query('COMMIT');

    res.json({ message: `${name} configuration saved` });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

exports.deleteGatewayConfigKey = async (req, res) => {
  try {
    const { name, key } = req.params;

    await pool.query(
      'DELETE FROM payment_gateway_config WHERE gateway = $1 AND config_key = $2',
      [name, key]
    );

    res.json({ message: 'Config key deleted' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleGateway = async (req, res) => {
  try {
    const { name } = req.params;

    const result = await pool.query(`
      UPDATE payment_gateways
      SET is_enabled = NOT is_enabled
      WHERE name = $1
      RETURNING name, is_enabled
    `, [name]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Gateway not found' });
    }

    const { is_enabled } = result.rows[0];
    res.json({
      message: `${name} ${is_enabled ? 'enabled' : 'disabled'}`,
      gateway: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
