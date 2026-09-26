export interface SubscriptionCouponDiscount {
  desconto_pct?: number | string | null
  desconto_valor?: number | string | null
}

export function hasFinancialCouponDiscount(coupon: SubscriptionCouponDiscount): boolean {
  return Number(coupon.desconto_pct ?? 0) > 0 || Number(coupon.desconto_valor ?? 0) > 0
}

export function getStoredPixCode(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const code = value.trim()
  return code.length > 0 ? code : null
}
