import dotenv from "dotenv";
dotenv.config();

import * as Cashfree from "cashfree-pg";

/**
 * ============================
 * CASHFREE ENVIRONMENT SETUP
 * ============================
 */
const envMode =
  process.env.CASHFREE_ENV === "PROD"
    ? Cashfree.Cashfree.PRODUCTION
    : Cashfree.Cashfree.SANDBOX;

// Set credentials (OFFICIAL WAY)
Cashfree.Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
Cashfree.Cashfree.XClientSecret = process.env.CASHFREE_CLIENT_SECRET;
Cashfree.Cashfree.XEnvironment = envMode;

/**
 * ============================
 * CREATE CASHFREE ORDER
 * ============================
 */
export async function createOrder({ orderId, amount, customer }) {
  try {
    const payload = {
      order_id: orderId,
      order_amount: Number(amount),
      order_currency: "INR",
      customer_details: {
        customer_id: customer.customer_id || `CU_${Date.now()}`,
        customer_name: customer.customer_name,
        customer_email: customer.customer_email,
        customer_phone: customer.customer_phone,
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL}/payment-status?order_id=${orderId}`,
      },
    };

    // Dev logs only
    if (process.env.CASHFREE_ENV !== "PROD") {
      console.log("Cashfree Create Order Payload:", payload);
    }

    const response = await Cashfree.Cashfree.PGCreateOrder(payload);

    return response.data;
  } catch (err) {
    console.error("Cashfree Create Order Error:", err.message || err);
    throw err;
  }
}

/**
 * ============================
 * VERIFY CASHFREE ORDER
 * ============================
 */
export async function verifyOrder(orderId) {
  try {
    const response = await Cashfree.Cashfree.PGFetchOrder(orderId);
    return response.data;
  } catch (err) {
    console.error("Cashfree Verify Order Error:", err.message || err);
    throw err;
  }
}
