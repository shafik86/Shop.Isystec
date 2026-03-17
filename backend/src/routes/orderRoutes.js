const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderDetail,
  getAllOrders,
  updateOrderStatus,
  getAdminOrderDetail
} = require('../controllers/orderController');
const { verifyToken, isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order from cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [payment_method]
 *             properties:
 *               payment_method:
 *                 type: string
 *                 enum: [stripe, senangpay, billplz]
 *                 example: billplz
 *               voucher_code:
 *                 type: string
 *                 example: SAVE10
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Cart empty / insufficient stock / invalid voucher
 */
router.post('/', verifyToken, createOrder);

/**
 * @swagger
 * /api/orders/my:
 *   get:
 *     summary: Get my orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user orders
 */
router.get('/my', verifyToken, getMyOrders);

/**
 * @swagger
 * /api/orders/my/{id}:
 *   get:
 *     summary: Get my order detail
 *     tags: [Orders]
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
 *         description: Order detail with items
 *       404:
 *         description: Order not found
 */
router.get('/my/:id', verifyToken, getOrderDetail);

/**
 * @swagger
 * /api/orders/admin:
 *   get:
 *     summary: Get all orders (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All orders with customer info
 */
router.get('/admin', verifyToken, isAdmin, getAllOrders);

/**
 * @swagger
 * /api/orders/admin/{id}:
 *   get:
 *     summary: Get order detail (Admin)
 *     tags: [Orders]
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
 *         description: Order detail
 *       404:
 *         description: Order not found
 */
router.get('/admin/:id', verifyToken, isAdmin, getAdminOrderDetail);

/**
 * @swagger
 * /api/orders/admin/{id}/status:
 *   patch:
 *     summary: Update order status (Admin)
 *     tags: [Orders]
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
 *               order_status:
 *                 type: string
 *                 enum: [pending, processing, shipped, completed, cancelled]
 *               payment_status:
 *                 type: string
 *                 enum: [pending, paid, failed]
 *     responses:
 *       200:
 *         description: Order updated
 *       404:
 *         description: Order not found
 */
router.patch('/admin/:id/status', verifyToken, isAdmin, updateOrderStatus);

module.exports = router;
