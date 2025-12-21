import dotenv from "dotenv";
dotenv.config();

import * as Cashfree from "cashfree-pg";

/**
 * =================================
 * CASHFREE ENVIRONMENT CONFIG
 * =================================
 */

// Validate required env variables
if (
  !process.env.CASHFREE_CLIENT_ID ||
  !process.env.CASHFREE_CLIENT_SECRET
) {
  throw new Error("❌ Cashfree credentials missing in environment variables");
}

// Set environment (TEST / PROD)
Cashfree.Cashfree.XEnvironment =
  process.env.CASHFREE_ENV === "PROD"
    ? Cashfree.Cashfree.PRODUCTION
    : Cashfree.Cashfree.SANDBOX;

// Set credentials (OFFICIAL WAY)
Cashfree.Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
Cashfree.Cashfree.XClientSecret = process.env.CASHFREE_CLIENT_SECRET;

console.log(
  `💰 Cashfree initialized in ${
    process.env.CASHFREE_ENV === "PROD" ? "PRODUCTION" : "TEST"
  } mode`
);

// Export Cashfree instance (optional, but clean)
export default Cashfree;
