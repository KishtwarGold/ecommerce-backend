import axios from "axios";

// ✅ Use correct API URL
const CASHFREE_API_URL = process.env.CASHFREE_ENV === "PROD" 
  ? "https://api.cashfree.com/pg" 
  : "https://sandbox.cashfree.com/pg";

// ✅ Create axios instance for better performance
const cashfreeClient = axios.create({
  baseURL: CASHFREE_API_URL,
  headers: {
    "Content-Type": "application/json",
    "x-api-version": "2023-08-01",
    "x-client-id": process.env.CASHFREE_CLIENT_ID,
    "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
  },
  timeout: 10000, // 10 second timeout
});

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
        return_url: `${process.env.FRONTEND_URL || process.env.CLIENT_URL}/payment-status?order_id=${orderId}`,
        // ✅ FIXED: Webhook should point to BACKEND not CLIENT
        notify_url: `${process.env.BACKEND_URL || 'https://ecommerce-backend-ip84.onrender.com'}/api/payment/webhook`,
      },
    };

    console.log("💳 Creating Cashfree order...");
    console.log("📍 Environment:", process.env.CASHFREE_ENV || 'SANDBOX');
    console.log("📦 Order ID:", orderId);
    console.log("💰 Amount:", amount);

    const response = await cashfreeClient.post("/orders", payload);

    console.log("✅ Order created successfully");
    return response.data;
    
  } catch (err) {
    console.error("❌ Cashfree Create Order Error:");
    console.error("Status:", err.response?.status);
    console.error("Data:", err.response?.data);
    console.error("Message:", err.message);
    
    throw new Error(
      err.response?.data?.message || 
      err.message || 
      "Failed to create Cashfree order"
    );
  }
}

export async function verifyOrder(orderId) {
  try {
    console.log("🔍 Verifying order:", orderId);
    
    const response = await cashfreeClient.get(`/orders/${orderId}`);

    console.log("✅ Order verified - Status:", response.data.order_status);
    return response.data;
    
  } catch (err) {
    console.error("❌ Cashfree Verify Error:");
    console.error("Status:", err.response?.status);
    console.error("Data:", err.response?.data);
    
    throw new Error(
      err.response?.data?.message || 
      "Failed to verify order"
    );
  }
}