import { authedFetch, isApiError, DEMO_MODE_ERROR } from '@rentascooter/api';

export type PromoValidateResult =
  | {
      valid: true;
      code: string;
      discountType: 'percentage' | 'flat';
      discountValue: number;
      discountXof: number;
      finalFareXof: number;
    }
  | {
      valid: false;
      reason: 'INVALID_CODE' | 'EXPIRED' | 'EXHAUSTED' | 'ALREADY_USED' | 'MIN_FARE_NOT_MET';
    };

export async function validatePromoCode(
  code: string,
  fareEstimateXof: number,
): Promise<PromoValidateResult> {
  try {
    const data = await authedFetch('POST', '/promo-codes/validate', {
      code: code.trim().toUpperCase(),
      fareEstimateXof,
    });
    return data as PromoValidateResult;
  } catch (e) {
    if (isApiError(e) && e.code === DEMO_MODE_ERROR.code) {
      if (code.trim().toUpperCase() === 'TEST') {
        return {
          valid: true,
          code: 'TEST',
          discountType: 'flat',
          discountValue: 500,
          discountXof: 500,
          finalFareXof: Math.max(0, fareEstimateXof - 500),
        };
      }
      return { valid: false, reason: 'INVALID_CODE' };
    }
    throw e;
  }
}
