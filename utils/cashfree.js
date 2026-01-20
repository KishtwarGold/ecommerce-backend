import axios from "axios";

// ✅ Ab yeh sahi API URL use karega
const CASHFREE_API_URL = process.env.CASHFREE_ENV === "PROD" 
  ? "https://api.cashfree.com/pg" 
  : "https://sandbox.cashfree.com/pg";

export async function createOrder({ orderId, amount, customer }) {
  try {
    const payload = {
      order_id: orderId,
      order_amount: parseFloat(amount).toFixed(2),
      order_currency: "INR",
      customer_details: {
        customer_id: customer.customer_id || `CU_${Date.now()}`,
        customer_name: customer.customer_name,
        customer_email: customer.customer_email,
        customer_phone: customer.customer_phone,
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL}/payment-status?order_id=${orderId}`,
        // ✅ Webhook URL add kiya
        notify_url: `${process.env.CLIENT_URL}/api/payment/webhook`,
      },
    };

    // ✅ Debug logs
    console.log("🔥 Cashfree API URL:", CASHFREE_API_URL);
    console.log("🔥 Environment:", process.env.CASHFREE_ENV);
    console.log("🔥 Create Order Payload:", payload);

    const response = await axios.post(
      `${CASHFREE_API_URL}/orders`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2023-08-01",
          "x-client-id": process.env.CASHFREE_CLIENT_ID,
          "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
        },
      }
    );

    console.log("✅ Cashfree Order Created Successfully:", response.data);
    return response.data;
  } catch (err) {
    console.error("❌ Cashfree Create Order Error:", err.response?.data || err.message);
    console.error("❌ Full Error:", err);
    throw err;
  }
}

export async function verifyOrder(orderId) {
  try {
    console.log("🔍 Verifying order:", orderId);
    
    const response = await axios.get(
      `${CASHFREE_API_URL}/orders/${orderId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2023-08-01",
          "x-client-id": process.env.CASHFREE_CLIENT_ID,
          "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
        },
      }
    );

    console.log("✅ Cashfree Order Verified:", response.data);
    return response.data;
  } catch (err) {
    console.error("❌ Cashfree Verify Error:", err.response?.data || err.message);
    throw err;
  }
}