import axios from "axios";

// ✅ Use correct API URL
const CASHFREE_API_URL = process.env.CASHFREE_ENV === "PROD" 
  ? "https://api.cashfree.com/pg" 
  : "https://sandbox.cashfree.com/pg";

// ✅ Validate credentials on startup
if (!process.env.CASHFREE_CLIENT_ID || !process.env.CASHFREE_CLIENT_SECRET) {
  console.error("❌ CRITICAL: Cashfree credentials missing in .env file!");
  console.error("Required: CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET");
}

console.log("🔧 Cashfree Config:");
console.log("   Environment:", process.env.CASHFREE_ENV || "SANDBOX");
console.log("   API URL:", CASHFREE_API_URL);
console.log("   Client ID:", process.env.CASHFREE_CLIENT_ID ? "✅ Set" : "❌ Missing");
console.log("   Client Secret:", process.env.CASHFREE_CLIENT_SECRET ? "✅ Set" : "❌ Missing");

// ✅ Create axios instance with increased timeout
const cashfreeClient = axios.create({
  baseURL: CASHFREE_API_URL,
  headers: {
    "Content-Type": "application/json",
    "x-api-version": "2023-08-01",
    "x-client-id": process.env.CASHFREE_CLIENT_ID,
    "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
  },
  timeout: 30000, // ✅ Increased to 30 seconds
});

export async function createOrder({ orderId, amount, customer }) {
  try {
    // ✅ Validate inputs
    if (!orderId || !amount || !customer) {
      throw new Error("Missing required parameters: orderId, amount, or customer");
    }

    if (!customer.customer_name || !customer.customer_email || !customer.customer_phone) {
      throw new Error("Missing customer details: name, email, or phone required");
    }

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
        notify_url: `${process.env.BACKEND_URL || 'https://ecommerce-backend-ip84.onrender.com'}/api/payment/webhook`,
      },
    };

    console.log("💳 Creating Cashfree order...");
    console.log("📍 Environment:", process.env.CASHFREE_ENV || 'SANDBOX');
    console.log("📍 API URL:", CASHFREE_API_URL);
    console.log("📦 Order ID:", orderId);
    console.log("💰 Amount:", amount);
    console.log("👤 Customer:", customer.customer_name, customer.customer_email);

    const startTime = Date.now();
    const response = await cashfreeClient.post("/orders", payload);
    const duration = Date.now() - startTime;

    console.log(`✅ Order created successfully in ${duration}ms`);
    console.log("📄 Session ID:", response.data.payment_session_id);
    
    return response.data;
    
  } catch (err) {
    console.error("❌ Cashfree Create Order Error:");
    
    if (err.code === 'ECONNABORTED') {
      console.error("⏱️  Request TIMEOUT - Cashfree API not responding");
      console.error("Check: 1) Internet connection 2) Cashfree API status 3) Firewall");
    } else if (err.response) {
      // Cashfree API returned an error
      console.error("Status:", err.response.status);
      console.error("Data:", JSON.stringify(err.response.data, null, 2));
      console.error("Headers:", err.response.headers);
    } else if (err.request) {
      // Request was made but no response
      console.error("❌ No response from Cashfree API");
      console.error("Request:", err.request);
    } else {
      // Something else happened
      console.error("Message:", err.message);
    }
    
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
    
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("Message:", err.message);
    }
    
    throw new Error(
      err.response?.data?.message || 
      "Failed to verify order"
    );
  }
}