/**
 * Test HyperPG session from command line (same request as Postman).
 * Run from project root: node scripts/test-hyperpg-session.js
 * Uses HYPERPG_API_KEY and HYPERPG_BASE_URL from env (or .env if you use dotenv).
 */
const apiKey = process.env.HYPERPG_API_KEY || "DFEB00963E94D7A9E7AEBA345122BA";
const baseUrl = (process.env.HYPERPG_BASE_URL || "https://sandbox.hyperpg.in").replace(/\/$/, "");
const auth = Buffer.from(apiKey, "utf8").toString("base64");

const body = {
  mobile_country_code: "+91",
  payment_page_client_id: "test",
  amount: 100,
  currency: "INR",
  action: "paymentPage",
  customer_email: "test@example.com",
  customer_phone: "8888899999",
  first_name: "John",
  last_name: "Doe",
  description: "Test payment",
  customer_id: "test-customer",
  order_id: "test-order-" + Date.now(),
  return_url: "https://hyperpg.in/",
  send_mail: false,
  send_sms: false,
  send_whatsapp: false,
};

async function main() {
  console.log("POST", baseUrl + "/session");
  console.log("Authorization: Basic", auth, "(length", 6 + auth.length + ")");
  console.log("Body keys:", Object.keys(body).join(", "));
  const res = await fetch(baseUrl + "/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + auth,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text.slice(0, 500));
  if (res.ok) {
    const j = JSON.parse(text);
    if (j.payment_links?.web) console.log("Payment URL:", j.payment_links.web);
  }
}

main().catch((e) => console.error(e));
