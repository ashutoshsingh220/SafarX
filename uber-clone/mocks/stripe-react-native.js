import React from "react";

export const StripeProvider = ({ children }) => <>{children}</>;

export const useStripe = () => ({
  initPaymentSheet: async () => ({ error: null }),
  presentPaymentSheet: async () => ({ error: null }),
  confirmPayment: async () => ({ error: null }),
});

export default {
  StripeProvider,
  useStripe,
};
