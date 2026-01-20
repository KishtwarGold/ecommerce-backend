// routes/payment.js
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { createOrder, verifyOrder } from "../utils/cashfree.js";

const router = express.Router();

// =====================
// Create Payment Order - OPTIMIZED
// =====================
router.post("/create", async (req, res) => {
  // Set response headers for faster processing
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  try {
    let { amount, customer } = req.body;

    // Convert string amount to number
    amount = Number(amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive number",
      });
    }

    // Validate customer
    if (
      !customer ||
      !customer.customer_name ||
      !customer.customer_email ||
      !customer.customer_phone
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer name, email and phone are required",
      });
    }

    // ✅ SAFE unique order ID
    const orderId = "KG_" + uuidv4();

    console.log("💳 Creating payment order:", { orderId, amount });

    // Call Cashfree create order
    const data = await createOrder({
      orderId,
      amount,
      customer: {
        customer_id: customer.customer_id || `guest_${Date.now()}`,
        customer_name: customer.customer_name,
        customer_email: customer.customer_email,
        customer_phone: customer.customer_phone,
      },
    });

    if (!data?.payment_session_id) {
      console.error("❌ Invalid Cashfree response:", data);
      return res.status(500).json({
        success: false,
        message: "Failed to create payment session",
      });
    }

    console.log("✅ Payment session created successfully");

    return res.status(200).json({
      success: true,
      orderId,
      paymentSessionId: data.payment_session_id,
    });

  } catch (err) {
    console.error("❌ Cashfree Create Error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: err.response?.data?.message || "Payment creation failed",
      error: process.env.NODE_ENV !== "production" ? err.message : undefined
    });
  }
});

// Keep the rest of your routes unchanged...
router.post("/verify", async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    console.log("🔍 Verifying payment order:", orderId);

    const data = await verifyOrder(orderId);

    if (!data || !data.order_status) {
      return res.status(500).json({
        success: false,
        message: "Invalid response from Cashfree",
      });
    }

    if (data.order_status === "PAID") {
      console.log("✅ Payment verified: PAID");
      return res.status(200).json({
        success: true,
        status: "PAID",
      });
    }

    return res.status(200).json({
      success: false,
      status: data.order_status,
    });

  } catch (err) {
    console.error("❌ Cashfree Verify Error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    console.log("🎯 Webhook received from Cashfree:", req.body);

    const { data } = req.body;
    
    if (!data) {
      console.error("❌ Invalid webhook data");
      return res.status(400).json({ success: false });
    }

    const { order_id, order_status, payment_amount } = data.order;

    console.log(`📦 Order ID: ${order_id}`);
    console.log(`💰 Amount: ${payment_amount}`);
    console.log(`✅ Status: ${order_status}`);

    if (order_status === "PAID") {
      console.log(`✅ Payment successful for order: ${order_id}`);
    } 
    else if (order_status === "FAILED") {
      console.log(`❌ Payment failed for order: ${order_id}`);
    }
    else if (order_status === "USER_DROPPED") {
      console.log(`⚠️ User cancelled payment for order: ${order_id}`);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("❌ Webhook error:", error);
    return res.status(500).json({ success: false });
  }
});

export default router;