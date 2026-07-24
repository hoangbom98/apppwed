/**
 * LKvip Payment Module
 *
 * Provides internal payment gateway for the LKvip platform:
 * - Virtual Account (VA) generation + QR code
 * - Internal webhook for deposit confirmation
 * - Withdrawal requests + admin approval flow
 * - AML monitoring
 */
const router = require('./routes/index');

module.exports = { router };
