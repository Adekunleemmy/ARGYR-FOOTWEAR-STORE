import { config } from '../config';

const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

export interface FlutterwavePaymentInitPayload {
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  customer: {
    email: string;
    phonenumber?: string;
    name: string;
  };
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  meta?: Record<string, any>;
}

export interface FlutterwaveVerifyResponse {
  status: string;
  message: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    ip: string;
    narration: string;
    status: string;
    payment_type: string;
    created_at: string;
    account_id: number;
    customer: {
      id: number;
      name: string;
      phone_number: string | null;
      email: string;
      created_at: string;
    };
    meta?: any;
  };
}

/**
 * Initialize a Flutterwave Standard hosted payment link
 */
export async function initializeFlutterwavePayment(payload: FlutterwavePaymentInitPayload): Promise<{
  success: boolean;
  paymentLink?: string;
  message?: string;
}> {
  const secretKey = config.FLUTTERWAVE.SECRET_KEY;

  if (!secretKey) {
    console.warn(`[Flutterwave] Secret key not set in environment.`);
    throw new Error("Flutterwave payment gateway is not configured on the server. Please provide FLW_SECRET_KEY.");
  }

  try {
    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        customizations: {
          title: payload.customizations?.title || "ARGYR Footwear Store",
          description: payload.customizations?.description || `Payment for order`,
          logo: payload.customizations?.logo || "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=300&q=80",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status !== 'success') {
      console.error(`[Flutterwave] Initialization error:`, data);
      throw new Error(data.message || "Failed to initialize Flutterwave payment");
    }

    return {
      success: true,
      paymentLink: data.data.link,
    };
  } catch (err: any) {
    console.error(`[Flutterwave] Network or initialization failure:`, err.message);
    throw err;
  }
}

/**
 * Verify a Flutterwave transaction server-side by ID
 */
export async function verifyFlutterwaveTransaction(transactionId: string | number): Promise<FlutterwaveVerifyResponse> {
  const secretKey = config.FLUTTERWAVE.SECRET_KEY;

  if (!secretKey) {
    throw new Error("Flutterwave secret key is missing. Cannot verify transaction.");
  }

  try {
    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data as FlutterwaveVerifyResponse;
  } catch (err: any) {
    console.error(`[Flutterwave] Verification call failed:`, err.message);
    throw new Error(`Payment verification service unavailable: ${err.message}`);
  }
}

/**
 * Validate webhook request header against configured secret hash
 */
export function verifyWebhookSecretHash(headerHash?: string): boolean {
  if (!headerHash) return false;
  return headerHash === config.FLUTTERWAVE.WEBHOOK_SECRET_HASH;
}
