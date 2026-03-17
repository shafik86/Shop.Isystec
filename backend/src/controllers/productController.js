const pool = require("../config/db");

// ─── PUBLIC ────────────────────────────────────────────────────────────────

exports.getProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id, p.name, p.slug, p.price, p.stock,
        c.name AS category,
        (SELECT image_base64 FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1) AS first_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProductDetail = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await pool.query(`
      SELECT p.id, p.name, p.slug, p.description, p.price, p.stock,
             c.name AS category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = $1 AND p.status = 'published'
    `, [slug]);

    if (product.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const images = await pool.query(`
      SELECT id, image_base64, position
      FROM product_images
      WHERE product_id = $1
      ORDER BY position
    `, [product.rows[0].id]);

    res.json({
      ...product.rows[0],
      images: images.rows.map(r => r.image_base64)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN ─────────────────────────────────────────────────────────────────

exports.getAllProductsAdmin = async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT
        p.id, p.name, p.slug, p.price, p.stock, p.status, p.created_at,
        c.name AS category, c.id AS category_id,
        COUNT(pi.id) AS image_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON pi.product_id = p.id
    `;

    const params = [];
    const where = [];

    if (status) {
      params.push(status);
      where.push(`p.status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      where.push(`p.name ILIKE $${params.length}`);
    }

    if (where.length > 0) {
      query += ' WHERE ' + where.join(' AND ');
    }

    query += ' GROUP BY p.id, c.name, c.id ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAdminProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await pool.query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [id]);

    if (product.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const images = await pool.query(`
      SELECT id, image_base64, position
      FROM product_images
      WHERE product_id = $1
      ORDER BY position
    `, [id]);

    res.json({ ...product.rows[0], images: images.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, slug, description, price, stock, category_id } = req.body;

    if (!name || !slug || !price) {
      return res.status(400).json({ message: "name, slug, and price are required" });
    }

    const result = await pool.query(`
      INSERT INTO products (name, slug, description, price, stock, category_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'draft')
      RETURNING *
    `, [name, slug, description || null, price, stock || 0, category_id || null]);

    res.status(201).json({ message: "Product created", product: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: "Slug already exists" });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, price, stock, category_id } = req.body;

    const result = await pool.query(`
      UPDATE products
      SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        stock = COALESCE($5, stock),
        category_id = COALESCE($6, category_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [name, slug, description, price, stock, category_id || null, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product updated", product: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: "Slug already exists" });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.publishProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await pool.query('SELECT stock FROM products WHERE id = $1', [id]);

    if (product.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.rows[0].stock <= 0) {
      return res.status(400).json({ message: "Cannot publish: stock must be greater than 0" });
    }

    const images = await pool.query(
      'SELECT COUNT(*) FROM product_images WHERE product_id = $1',
      [id]
    );

    if (parseInt(images.rows[0].count) < 3) {
      return res.status(400).json({ message: "Cannot publish: minimum 3 images required" });
    }

    await pool.query("UPDATE products SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);

    res.json({ message: "Product published" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.archiveProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE products SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product archived" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.unpublishProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE products SET status = 'draft', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product set to draft" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── IMAGES ────────────────────────────────────────────────────────────────

exports.addProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { image_base64, position } = req.body;

    if (!image_base64) {
      return res.status(400).json({ message: "image_base64 is required" });
    }

    const product = await pool.query('SELECT id FROM products WHERE id = $1', [id]);
    if (product.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Auto assign next position if not provided
    let pos = position;
    if (!pos) {
      const maxPos = await pool.query(
        'SELECT COALESCE(MAX(position), 0) + 1 AS next FROM product_images WHERE product_id = $1',
        [id]
      );
      pos = maxPos.rows[0].next;
    }

    const result = await pool.query(`
      INSERT INTO product_images (product_id, image_base64, position)
      VALUES ($1, $2, $3)
      RETURNING id, position
    `, [id, image_base64, pos]);

    res.status(201).json({ message: "Image added", image: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const result = await pool.query(
      'DELETE FROM product_images WHERE id = $1 RETURNING id',
      [imageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.json({ message: "Image deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.reorderImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { order } = req.body; // array of { id, position }

    if (!Array.isArray(order)) {
      return res.status(400).json({ message: "order must be an array of { id, position }" });
    }

    for (const item of order) {
      await pool.query(
        'UPDATE product_images SET position = $1 WHERE id = $2 AND product_id = $3',
        [item.position, item.id, id]
      );
    }

    res.json({ message: "Images reordered" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
