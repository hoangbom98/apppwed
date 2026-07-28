/**
 * Payment Service — gateway helpers, webhook processing, fee calculation.
 *
 * Supported gateways (via env):
 *   - Bank transfer (manual)
 *   - USDT / crypto (manual or third-party)
 *   - MoMo (Vietnam)
 *   - ZaloPay (Vietnam)
 *   - VNPay (Vietnam)
 *   - PayPal (international)
 *
 * All gateway-specific logic should extend this service.
 */
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const logger = require('./logger');

/**
 * Fetch local Vietnamese bank list.
 */
async function getBankList() {
  try {
    const dataPath = path.join(__dirname, '../data/banks.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    logger.error('[BankList] Failed to load local bank list', error);
    return [];
  }
}

/* ── Fee helpers ────────────────────────────────────────────── */

/**
 * Calculate withdrawal fee based on method.
 * Returns the fee amount (number).
 */
function calcWithdrawalFee(method, amount) {
  const amt = Number(amount);
  const fees = {
    bank:     Math.max(2,    amt * 0.005),  // 0.5%, min $2
    usdt:     Math.max(1,    amt * 0.002),  // 0.2%, min $1
    momo:     Math.max(0.5,  amt * 0.003),  // 0.3%, min $0.50
    paypal:   Math.max(1.5,  amt * 0.029),  // 2.9%, min $1.50
    skrill:   Math.max(1,    amt * 0.01),   // 1%,   min $1
    neteller: Math.max(1,    amt * 0.0195), // 1.95%, min $1
  };
  return parseFloat((fees[method] ?? amt * 0.01).toFixed(2));
}

/**
 * Calculate deposit fee (usually 0, but may apply for some gateways).
 */
function calcDepositFee(method, amount) {
  const amt = Number(amount);
  const fees = {
    paypal:  Math.max(0.3, amt * 0.029),
    skrill:  amt * 0.009,
    neteller: amt * 0.0195,
  };
  return parseFloat((fees[method] ?? 0).toFixed(2));
}

/* ── Webhook processing ─────────────────────────────────────── */

/**
 * Handle incoming payment webhook.
 * Identifies the provider and dispatches to the correct handler.
 * @param {object} data       – raw webhook body
 * @param {string} provider   – 'momo'|'paypal'|'bank'|'usdt'
 * @param {object} prisma     – Prisma client for the relevant project DB
 * @returns {{ orderId, status, amount }}
 */
async function handleWebhook(data, provider, prisma) {
  logger.info(`[Payment] Webhook received provider=${provider}`, { data });

  switch (provider) {
    case 'momo':   return handleMomoWebhook(data, prisma);
    case 'paypal': return handlePaypalWebhook(data, prisma);
    default:       return handleGenericWebhook(data, prisma);
  }
}

async function handleMomoWebhook(data, prisma) {
  // MoMo IPN: data.orderId, data.amount, data.resultCode (0 = success)
  const { orderId, amount, resultCode } = data;
  const status = resultCode === 0 ? 'success' : 'failed';

  await prisma.depositOrder.updateMany({
    where: { id: parseInt(orderId) },
    data:  { status, processedAt: new Date() },
  });

  logger.info(`[Payment] MoMo webhook orderId=${orderId} status=${status}`);
  return { orderId, status, amount };
}

async function handlePaypalWebhook(data, prisma) {
  // PayPal IPN: data.txn_id, data.mc_gross, data.payment_status
  const { custom: orderId, mc_gross: amount, payment_status } = data;
  const status = payment_status === 'Completed' ? 'success' : 'failed';

  await prisma.depositOrder.updateMany({
    where: { id: parseInt(orderId) },
    data:  { status, txId: data.txn_id, processedAt: new Date() },
  });

  logger.info(`[Payment] PayPal webhook orderId=${orderId} status=${status}`);
  return { orderId, status, amount };
}

async function handleGenericWebhook(data, prisma) {
  // Generic: { orderId, txId, status, amount }
  const { orderId, txId, status = 'success', amount } = data;

  await prisma.depositOrder.updateMany({
    where: { id: parseInt(orderId) },
    data:  { status, txId, processedAt: new Date() },
  });

  logger.info(`[Payment] Generic webhook orderId=${orderId} status=${status}`);
  return { orderId, status, amount };
}

/* ── Deposit helpers ────────────────────────────────────────── */

/**
 * Create a deposit order in the DB (before payment redirect).
 */
async function createDepositOrder(prisma, userId, method, amount, extra = {}) {
  const fee = calcDepositFee(method, amount);
  return prisma.depositOrder.create({
    data: {
      userId,
      method,
      amount,
      fee,
      status: 'pending',
      ...extra,
    },
  });
}

/**
 * Confirm a deposit: mark as success and credit wallet.
 */
async function confirmDeposit(prisma, orderId, txId = null) {
  const order = await prisma.depositOrder.findUnique({ where: { id: parseInt(orderId) } });
  if (!order) throw new Error('Deposit order not found');
  if (order.status === 'success') throw new Error('Order already confirmed');

  const walletSvc = require('./walletService');

  await prisma.depositOrder.update({
    where: { id: order.id },
    data:  { status: 'success', txId, processedAt: new Date() },
  });

  await walletSvc.credit(
    prisma,
    order.userId,
    parseFloat(order.amount),
    'deposit',
    `Deposit order #${orderId}`,
  );

  logger.info(`[Payment] Deposit confirmed orderId=${orderId} userId=${order.userId} amount=${order.amount}`);
  return order;
}

/* ── Withdrawal helpers ─────────────────────────────────────── */

/**
 * Create a withdrawal order (freezes funds).
 */
async function createWithdrawOrder(prisma, userId, method, amount, extra = {}) {
  const fee     = calcWithdrawalFee(method, amount);
  const total   = parseFloat(amount) + fee;
  const walletSvc = require('./walletService');

  // Freeze the full amount + fee
  await walletSvc.freeze(prisma, userId, total);

  return prisma.withdrawOrder.create({
    data: {
      userId,
      method,
      amount,
      fee,
      status: 'pending',
      ...extra,
    },
  });
}

/**
 * Approve a withdrawal: settle frozen funds, mark success.
 */
async function approveWithdraw(prisma, orderId, txId = null) {
  const order = await prisma.withdrawOrder.findUnique({ where: { id: parseInt(orderId) } });
  if (!order) throw new Error('Withdraw order not found');
  if (order.status !== 'pending') throw new Error(`Cannot approve order with status: ${order.status}`);

  const walletSvc = require('./walletService');
  const total = parseFloat(order.amount) + parseFloat(order.fee || 0);

  await walletSvc.settleFrozen(
    prisma,
    order.userId,
    total,
    'withdraw',
    `Withdraw order #${orderId}`,
  );

  return prisma.withdrawOrder.update({
    where: { id: order.id },
    data:  { status: 'success', txId, processedAt: new Date() },
  });
}

/**
 * Reject a withdrawal: unfreeze funds, mark rejected.
 */
async function rejectWithdraw(prisma, orderId, note = '') {
  const order = await prisma.withdrawOrder.findUnique({ where: { id: parseInt(orderId) } });
  if (!order) throw new Error('Withdraw order not found');
  if (order.status !== 'pending') throw new Error(`Cannot reject order with status: ${order.status}`);

  const walletSvc = require('./walletService');
  const total = parseFloat(order.amount) + parseFloat(order.fee || 0);

  await walletSvc.unfreeze(prisma, order.userId, total);

  return prisma.withdrawOrder.update({
    where: { id: order.id },
    data:  { status: 'rejected', note, processedAt: new Date() },
  });
}

/* ── MoMo payment gateway ───────────────────────────────────────── */

/**
 * Create a MoMo payment URL/QR for a deposit.
 * Returns { payUrl, qrCodeUrl, deeplink, orderId }
 */
async function createMomoPayment(orderId, amount, orderInfo = 'Nạp tiền') {
  const axios  = require('axios');
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey   = process.env.MOMO_ACCESS_KEY;
  const secretKey   = process.env.MOMO_SECRET_KEY;
  const endpoint    = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';

  if (!partnerCode || !accessKey || !secretKey) {
    logger.warn('[MoMo] Not configured — returning mock response');
    return { payUrl: null, qrCodeUrl: null, orderId, mock: true };
  }

  const redirectUrl = process.env.MOMO_REDIRECT_URL || `${process.env.APP_URL || 'http://localhost:5000'}/payment/momo/return`;
  const ipnUrl      = process.env.MOMO_IPN_URL      || `${process.env.APP_URL || 'http://localhost:5000'}/api/lkvip/webhooks/momo`;
  const requestId   = `${partnerCode}_${Date.now()}`;

  const rawSignature =
    `accessKey=${accessKey}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${orderId}` +
    `&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}&requestType=captureWallet`;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  const body = {
    partnerCode, accessKey, requestId, amount: parseInt(amount), orderId,
    orderInfo, redirectUrl, ipnUrl, extraData: '',
    requestType: 'captureWallet', signature, lang: 'vi',
  };

  const res = await axios.post(endpoint, body, { headers: { 'Content-Type': 'application/json' } });
  const data = res.data;

  if (data.resultCode !== 0) {
    logger.error(`[MoMo] Create payment failed: [${data.resultCode}] ${data.message}`);
    throw new Error(`MoMo: ${data.message}`);
  }

  logger.info(`[MoMo] Payment created orderId=${orderId} amount=${amount}`);
  return {
    payUrl:      data.payUrl,
    qrCodeUrl:   data.qrCodeUrl,
    deeplink:    data.deeplink,
    orderId:     data.orderId,
  };
}

/**
 * Verify MoMo IPN callback.
 * @param {object} body – raw IPN body from MoMo
 * @returns {boolean}
 */
function verifyMomoSignature(body) {
  const secretKey = process.env.MOMO_SECRET_KEY || '';
  const { partnerCode, orderId, requestId, amount, orderInfo, orderType,
          transId, resultCode, message, payType, responseTime, extraData, signature } = body;

  const rawSignature =
    `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}` +
    `&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}` +
    `&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}` +
    `&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

  const expected = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
  return expected === signature;
}

/* ── ZaloPay payment gateway ────────────────────────────────────── */

/**
 * Create a ZaloPay order.
 */
async function createZaloPayOrder(orderId, amount, description = 'Nạp tiền') {
  const axios  = require('axios');
  const appId  = process.env.ZALOPAY_APP_ID;
  const key1   = process.env.ZALOPAY_KEY1;
  if (!appId || !key1) {
    logger.warn('[ZaloPay] Not configured');
    return { order_url: null, orderId, mock: true };
  }

  const appTime   = Date.now();
  const appTransId = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${orderId}`;
  const embedData = JSON.stringify({ redirecturl: process.env.ZALOPAY_REDIRECT_URL || '' });
  const items     = '[]';

  const hmacInput = `${appId}|${appTransId}|${1}|${amount}|${appTime}|${embedData}|${items}`;
  const mac = crypto.createHmac('sha256', key1).update(hmacInput).digest('hex');

  const res = await axios.post('https://sb-openapi.zalopay.vn/v2/create', {
    app_id:       parseInt(appId),
    app_trans_id: appTransId,
    app_user:     String(orderId),
    app_time:     appTime,
    amount,
    item:         items,
    description,
    embed_data:   embedData,
    mac,
  });

  if (res.data.return_code !== 1) {
    throw new Error(`ZaloPay: ${res.data.return_message}`);
  }

  return { order_url: res.data.order_url, zp_trans_token: res.data.zp_trans_token, orderId };
}

/**
 * Verify ZaloPay callback MAC.
 */
function verifyZaloPayCallback(data, mac) {
  const key2    = process.env.ZALOPAY_KEY2 || '';
  const expected = crypto.createHmac('sha256', key2).update(data).digest('hex');
  return expected === mac;
}

/* ── VNPay payment gateway ──────────────────────────────────────── */

/**
 * Create a VNPay payment URL.
 */
function createVNPayUrl(orderId, amount, orderInfo = 'Nạp tiền', returnUrl = null, ipAddr = '127.0.0.1') {
  const tmnCode   = process.env.VNPAY_TMN_CODE;
  const hashSecret = process.env.VNPAY_HASH_SECRET;
  if (!tmnCode || !hashSecret) {
    logger.warn('[VNPay] Not configured');
    return null;
  }

  const createDate = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const params = {
    vnp_Version:    '2.1.0',
    vnp_Command:    'pay',
    vnp_TmnCode:    tmnCode,
    vnp_Amount:     amount * 100,  // VNPay requires amount * 100
    vnp_CurrCode:   'VND',
    vnp_TxnRef:     String(orderId),
    vnp_OrderInfo:  orderInfo,
    vnp_OrderType:  'other',
    vnp_Locale:     'vn',
    vnp_ReturnUrl:  returnUrl || `${process.env.APP_URL || 'http://localhost:5000'}/payment/vnpay/return`,
    vnp_IpAddr:     ipAddr,
    vnp_CreateDate: createDate,
  };

  const sortedParams = Object.keys(params).sort().reduce((acc, k) => { acc[k] = params[k]; return acc; }, {});
  const queryString  = new URLSearchParams(sortedParams).toString();
  const secureHash   = crypto.createHmac('sha512', hashSecret).update(queryString).digest('hex');

  return `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${queryString}&vnp_SecureHash=${secureHash}`;
}

module.exports = {
  calcWithdrawalFee,
  calcDepositFee,
  handleWebhook,
  createDepositOrder,
  confirmDeposit,
  createWithdrawOrder,
  approveWithdraw,
  rejectWithdraw,
  // MoMo
  createMomoPayment,
  verifyMomoSignature,
  // ZaloPay
  createZaloPayOrder,
  verifyZaloPayCallback,
  // VNPay
  createVNPayUrl,
  getBankList,
};
