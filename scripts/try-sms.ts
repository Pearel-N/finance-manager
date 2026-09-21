// Quick manual test for the SMS parser. Not part of the app.
// Run: npx tsx --env-file=.env scripts/try-sms.ts
import { parseSms } from "../src/lib/sms-parser";

// Pretend these are the user's categories.
const categories = ["Food", "Salary", "Shopping", "Rent"];

const samples = [
  "Rs.450.00 debited from A/c XX1234 on 21-09-26 to VPA swiggy@icici. UPI Ref 426512345678. Not you? Call 18002586161 - HDFC Bank",
  "Your A/c XX1234 is credited with INR 52,000.00 on 20-Sep-2026 by NEFT from ACME TECHNOLOGIES PVT LTD. Avl Bal INR 61,245.50 - Axis Bank",
  "123456 is your OTP for a transaction of Rs.2,999.00 at AMAZON. Valid for 10 mins. Do not share it with anyone - ICICI Bank",
];

async function main() {
  for (const sms of samples) {
    console.log("\nSMS:   ", sms);
    console.log("RESULT:", await parseSms(sms, categories));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
