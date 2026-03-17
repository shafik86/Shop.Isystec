const express = require('express');
const router = express.Router();
const { getMethods, getAllGateways, toggleGateway, getGatewayConfig, saveGatewayConfig, deleteGatewayConfigKey } = require('../controllers/paymentGatewayController');
const { createPaymentIntent, confirmPayment } = require('../controllers/stripeController');
const { verifyToken, isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Payment Gateway
 *   description: Payment gateway management
 */

/**
 * @swagger
 * /api/payment/methods:
 *   get:
 *     summary: Get enabled payment methods (for checkout)
 *     tags: [Payment Gateway]
 *     responses:
 *       200:
 *         description: List of enabled gateways
 *         content:
 *           application/json:
 *             example:
 *               - name: stripe
 *                 enabled: true
 *               - name: billplz
 *                 enabled: true
 */
router.get('/methods', getMethods);

/**
 * @swagger
 * /api/payment/admin:
 *   get:
 *     summary: Get all gateways with status (Admin)
 *     tags: [Payment Gateway]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All gateways
 */
router.get('/admin', verifyToken, isAdmin, getAllGateways);

/**
 * @swagger
 * /api/payment/admin/{name}/toggle:
 *   patch:
 *     summary: Toggle gateway enable/disable (Admin)
 *     tags: [Payment Gateway]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *           enum: [stripe, senangpay, billplz]
 *         example: senangpay
 *     responses:
 *       200:
 *         description: Gateway toggled
 *       404:
 *         description: Gateway not found
 */
router.patch('/admin/:name/toggle', verifyToken, isAdmin, toggleGateway);

/**
 * @swagger
 * /api/payment/admin/{name}/config:
 *   get:
 *     summary: Get gateway config keys (Admin)
 *     tags: [Payment Gateway]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *           enum: [stripe, senangpay, billplz]
 *     responses:
 *       200:
 *         description: Config as key-value object
 *         content:
 *           application/json:
 *             example:
 *               secret_key: sk_live_xxx
 *               publishable_key: pk_live_xxx
 */
router.get('/admin/:name/config', verifyToken, isAdmin, getGatewayConfig);

/**
 * @swagger
 * /api/payment/admin/{name}/config:
 *   put:
 *     summary: Save gateway config (Admin) — upsert key-value pairs
 *     tags: [Payment Gateway]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *           enum: [stripe, senangpay, billplz]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *           examples:
 *             stripe:
 *               value:
 *                 secret_key: sk_live_xxx
 *                 publishable_key: pk_live_xxx
 *                 webhook_secret: whsec_xxx
 *             senangpay:
 *               value:
 *                 merchant_id: "12345"
 *                 secret_key: abc123
 *                 callback_url: https://yourdomain.com/api/payment/callback/senangpay
 *             billplz:
 *               value:
 *                 api_key: abc123
 *                 collection_id: xyz789
 *                 x_signature_key: sig123
 *                 callback_url: https://yourdomain.com/api/payment/callback/billplz
 *     responses:
 *       200:
 *         description: Config saved
 */
router.put('/admin/:name/config', verifyToken, isAdmin, saveGatewayConfig);

/**
 * @swagger
 * /api/payment/admin/{name}/config/{key}:
 *   delete:
 *     summary: Delete a specific config key (Admin)
 *     tags: [Payment Gateway]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Config key deleted
 */
router.delete('/admin/:name/config/:key', verifyToken, isAdmin, deleteGatewayConfigKey);

// Stripe payment flow (authenticated customer)
router.post('/stripe/create-intent', verifyToken, createPaymentIntent);
router.post('/stripe/confirm', verifyToken, confirmPayment);

module.exports = router;
