import express from "express";
import { v4 as uuidv4 } from "uuid";
import Order from "../models/Order.js";
import { createOrder } from "../utils/cashfree.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { items, amount, customer } = req.body;

    const orderId = "KG_" + uuidv4();

    // 1️⃣ Save order in MongoDB
    await Order.create({
      orderId,
      items,
      amount,
      customer,
      paymentStatus: "PENDING",
    });

    // 2️⃣ Create Cashfree order
    const cfOrder = await createOrder({
      orderId,
      amount,
      customer,
    });

    return res.json({
      success: true,
      paymentSessionId: cfOrder.payment_session_id,
    });
  } catch (err) {
    console.error("Order create error:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
