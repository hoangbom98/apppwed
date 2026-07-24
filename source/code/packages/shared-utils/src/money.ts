import Decimal from 'decimal.js';

// Cấu hình đơn giản
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN });

export const toDecimal = (val: string | number) => new Decimal(val);

// Hàm tiện ích đơn giản, dễ đọc
export const formatMoney = (amount: string | number) => toDecimal(amount).toFixed(4);
