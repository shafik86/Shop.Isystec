const express = require('express');
const router = express.Router();
const { createVoucher, getVouchers, updateVoucherStatus, validateVoucher } = require('../controllers/voucherController');
const { verifyToken, isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Vouchers
 *   description: Voucher management
 */

/**
 * @swagger
 * /api/vouchers/validate/{code}:
 *   get:
 *     summary: Validate a voucher code
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         example: SAVE10
 *     responses:
 *       200:
 *         description: Voucher validation result
 *         content:
 *           application/json:
 *             examples:
 *               valid:
 *                 value:
 *                   valid: true
 *                   discount_type: percent
 *                   discount_value: 10
 *                   message: "Voucher valid: 10% off"
 *               invalid:
 *                 value:
 *                   valid: false
 *                   message: Voucher has expired
 */
router.get('/validate/:code', verifyToken, validateVoucher);

/**
 * @swagger
 * /api/vouchers/admin:
 *   get:
 *     summary: Get all vouchers (Admin)
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all vouchers with usage count
 */
router.get('/admin', verifyToken, isAdmin, getVouchers);

/**
 * @swagger
 * /api/vouchers/admin:
 *   post:
 *     summary: Create voucher (Admin)
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, discount_type, discount_value]
 *             properties:
 *               code:
 *                 type: string
 *                 example: SAVE10
 *               discount_type:
 *                 type: string
 *                 enum: [percent, amount]
 *                 example: percent
 *               discount_value:
 *                 type: number
 *                 example: 10
 *               usage_limit:
 *                 type: integer
 *                 example: 100
 *               expiry_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-31T23:59:59Z"
 *     responses:
 *       201:
 *         description: Voucher created
 *       409:
 *         description: Code already exists
 */
router.post('/admin', verifyToken, isAdmin, createVoucher);

/**
 * @swagger
 * /api/vouchers/admin/{id}/status:
 *   patch:
 *     summary: Update voucher status (Admin)
 *     tags: [Vouchers]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Voucher updated
 *       404:
 *         description: Voucher not found
 */
router.patch('/admin/:id/status', verifyToken, isAdmin, updateVoucherStatus);

module.exports = router;
