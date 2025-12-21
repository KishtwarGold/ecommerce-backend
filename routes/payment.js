// routes/payment.js
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { createOrder, verifyOrder } from "../utils/cashfree.js";

const router = express.Router();

// =====================
// Create Payment Order
// =====================
router.post("/create", async (req, res) => {
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

    console.log("Creating payment order:", { orderId, amount });

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
      console.error("Invalid Cashfree response:", data);
      return res.status(500).json({
        success: false,
        message: "Failed to create payment session",
      });
    }

    return res.status(200).json({
      success: true,
      orderId,
      paymentSessionId: data.payment_session_id,
    });

  } catch (err) {
    console.error("Cashfree Create Error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Payment creation failed",
    });
  }
});

// =====================
// Verify Payment Order
// =====================
router.post("/verify", async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    console.log("Verifying payment order:", orderId);

    const data = await verifyOrder(orderId);

    if (!data || !data.order_status) {
      return res.status(500).json({
        success: false,
        message: "Invalid response from Cashfree",
      });
    }

    // ✅ Only PAID means success
    if (data.order_status === "PAID") {
      // 🔥 Here you should save order in DB
      return res.status(200).json({
        success: true,
        status: "PAID",
      });
    }

    return res.status(200).json({
      success: false,
      status: data.order_status, // ACTIVE / EXPIRED / CANCELLED
    });

  } catch (err) {
    console.error("Cashfree Verify Error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
});

export default router;
