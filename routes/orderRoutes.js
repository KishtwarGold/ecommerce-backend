import express from "express";
import { v4 as uuidv4 } from "uuid";
import Order from "../models/Order.js";
import { createOrder } from "../utils/cashfree.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    console.log("📥 Incoming body:", req.body);

    const { items, amount, customer } = req.body;

    // 🔒 Basic validation (VERY IMPORTANT)
    if (!amount || !customer?.customer_name || !customer?.customer_phone) {
      return res.status(400).json({
        success: false,
        message: "Invalid order data",
      });
    }

    const orderId = "KG_" + uuidv4();

    // 1️⃣ Save order in MongoDB
    const order = await Order.create({
      orderId,
      items,
      amount,
      customer,
      paymentStatus: "PENDING",
    });

    console.log("✅ Order saved:", orderId);

    // 2️⃣ Create Cashfree order
    const cfOrder = await createOrder({
      orderId,
      amount,
      customer,
    });

    console.log("💳 Cashfree response:", cfOrder);

    // 🔥 SAFETY CHECK (THIS WAS MISSING)
    if (!cfOrder || !cfOrder.payment_session_id) {
      console.error("❌ Cashfree failed:", cfOrder);
      return res.status(500).json({
        success: false,
        message: "Cashfree payment session not created",
      });
    }

    return res.json({
      success: true,
      paymentSessionId: cfOrder.payment_session_id,
    });

  } catch (err) {
    console.error("❌ Order create error:", err.message || err);
    res.status(500).json({
      success: false,
      message: "Order creation failed",
    });
  }
});

export default router;
