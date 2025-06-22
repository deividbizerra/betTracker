import { base44 } from './base44Client';

// Create safe function wrappers that handle undefined base44.functions
const createSafeFunction = (functionName) => {
  return (...args) => {
    if (!base44.functions || !base44.functions[functionName]) {
      throw new Error(`Function ${functionName} is not available. Please ensure you are logged in.`);
    }
    return base44.functions[functionName](...args);
  };
};

export const confirmPaymentSession = base44.functions?.confirmPaymentSession || createSafeFunction('confirmPaymentSession');

export const stripeWebhook = base44.functions?.stripeWebhook || createSafeFunction('stripeWebhook');

export const createPortalSession = base44.functions?.createPortalSession || createSafeFunction('createPortalSession');

export const createCheckoutSession = base44.functions?.createCheckoutSession || createSafeFunction('createCheckoutSession');