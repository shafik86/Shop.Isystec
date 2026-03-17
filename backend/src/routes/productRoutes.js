const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductDetail,
  createProduct,
  updateProduct,
  deleteProduct,
  publishProduct,
  archiveProduct,
  unpublishProduct,
  getAllProductsAdmin,
  getAdminProductById,
  addProductImage,
  deleteProductImage,
  reorderImages
} = require("../controllers/productController");
const { verifyToken, isAdmin } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product catalog
 */

// ─── ADMIN routes MUST come before /:slug wildcard ──────────────────────────

/**
 * @swagger
 * /api/products/admin/all:
 *   get:
 *     summary: Get all products with all statuses (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of all products
 */
router.get("/admin/all", verifyToken, isAdmin, getAllProductsAdmin);

/**
 * @swagger
 * /api/products/admin/{id}:
 *   get:
 *     summary: Get product by ID with images (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product detail with images array (each has id, image_base64, position)
 *       404:
 *         description: Product not found
 */
router.get("/admin/:id", verifyToken, isAdmin, getAdminProductById);

/**
 * @swagger
 * /api/products/admin/create:
 *   post:
 *     summary: Create new product (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug, price]
 *             properties:
 *               name: { type: string, example: WildSec Motion Sensor }
 *               slug: { type: string, example: wildsec-motion-sensor }
 *               description: { type: string }
 *               price: { type: number, example: 129.90 }
 *               stock: { type: integer, example: 50 }
 *               category_id: { type: string }
 *     responses:
 *       201:
 *         description: Product created (status = draft)
 */
router.post("/admin/create", verifyToken, isAdmin, createProduct);

/**
 * @swagger
 * /api/products/admin/{id}:
 *   patch:
 *     summary: Update product details (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               stock: { type: integer }
 *               category_id: { type: string }
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 */
router.patch("/admin/:id", verifyToken, isAdmin, updateProduct);

/**
 * @swagger
 * /api/products/admin/{id}:
 *   delete:
 *     summary: Delete product (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 *       404:
 *         description: Product not found
 */
router.delete("/admin/:id", verifyToken, isAdmin, deleteProduct);

/**
 * @swagger
 * /api/products/admin/{id}/publish:
 *   patch:
 *     summary: Publish product — requires stock > 0 and min 3 images (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product published
 *       400:
 *         description: Cannot publish
 */
router.patch("/admin/:id/publish", verifyToken, isAdmin, publishProduct);

/**
 * @swagger
 * /api/products/admin/{id}/unpublish:
 *   patch:
 *     summary: Set product back to draft (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product set to draft
 */
router.patch("/admin/:id/unpublish", verifyToken, isAdmin, unpublishProduct);

/**
 * @swagger
 * /api/products/admin/{id}/archive:
 *   patch:
 *     summary: Archive product (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product archived
 */
router.patch("/admin/:id/archive", verifyToken, isAdmin, archiveProduct);

/**
 * @swagger
 * /api/products/admin/{id}/images:
 *   post:
 *     summary: Upload image to product (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [image_base64]
 *             properties:
 *               image_base64:
 *                 type: string
 *                 description: Base64 encoded image string
 *               position:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Image added
 */
router.post("/admin/:id/images", verifyToken, isAdmin, addProductImage);

/**
 * @swagger
 * /api/products/admin/{id}/images/reorder:
 *   patch:
 *     summary: Reorder product images (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     position: { type: integer }
 *     responses:
 *       200:
 *         description: Images reordered
 */
router.patch("/admin/:id/images/reorder", verifyToken, isAdmin, reorderImages);

/**
 * @swagger
 * /api/products/admin/images/{imageId}:
 *   delete:
 *     summary: Delete a product image (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted
 *       404:
 *         description: Image not found
 */
router.delete("/admin/images/:imageId", verifyToken, isAdmin, deleteProductImage);

// ─── PUBLIC routes ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all published products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of published products
 */
router.get("/", getProducts);

/**
 * @swagger
 * /api/products/{slug}:
 *   get:
 *     summary: Get product detail by slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product detail with base64 images array
 *       404:
 *         description: Product not found
 */
router.get("/:slug", getProductDetail);

module.exports = router;
