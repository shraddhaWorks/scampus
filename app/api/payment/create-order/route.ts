import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";
import type { Prisma } from "@prisma/client";

const hyperpgBaseUrl = process.env.HYPERPG_BASE_URL || "https://sandbox.hyperpg.in";
const globalHyperpgMerchantId = process.env.HYPERPG_MERCHANT_ID;
const globalHyperpgApiKey = process.env.HYPERPG_API_KEY;
const hyperpgClientId = process.env.HYPERPG_CLIENT_ID || "test";
// JusPay/HyperPG Session API: Basic Base64(apiKey + ":") + mandatory x-merchantid header
const hyperpgAuthStyle = process.env.HYPERPG_AUTH_STYLE || "api_key";

/** HyperPG requires order_id: alphanumeric, max 20 chars */
function generateOrderId(): string {
  const t = Date.now().toString(36).replace(/[^a-z0-9]/g, "").slice(-8);
  const r = Math.random().toString(36).replace(/[^a-z0-9]/g, "").slice(2, 6);
  return `TML${t}${r}`.slice(0, 20);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "STUDENT" || !session.user.studentId) {
    return NextResponse.json(
      { error: "Only students can create payment orders" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const rawAmount = body.amount;
    const returnPath = (body.return_path as string) || "/payments";
    const eventRegistrationId = typeof body.event_registration_id === "string" && body.event_registration_id ? body.event_registration_id : null;

    const amountNumber =
      typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;

    if (!amountNumber || isNaN(amountNumber) || amountNumber < 1) {
      return NextResponse.json(
        { error: "Invalid amount (minimum INR 1)" },
        { status: 400 }
      );
    }

    // For fee payments (no workshop): enforce amount does not exceed remaining fee
    if (!eventRegistrationId) {
      const fee = await prisma.studentFee.findUnique({
        where: { studentId: session.user.studentId },
        select: { remainingFee: true },
      });
      const maxAllowed = fee ? fee.remainingFee : 0;
      if (amountNumber > maxAllowed + 0.01) {
        return NextResponse.json(
          { error: `Amount cannot exceed remaining fee (₹${maxAllowed.toFixed(2)})` },
          { status: 400 }
        );
      }
    }

    const student = await prisma.student.findUnique({
      where: { id: session.user.studentId },
      select: {
        schoolId: true,
        phoneNo: true,
        fatherName: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const useGlobalOnly = process.env.HYPERPG_USE_GLOBAL_CREDENTIALS === "true" || process.env.HYPERPG_USE_GLOBAL_CREDENTIALS === "1";
    const settings = useGlobalOnly ? null : await prisma.schoolSettings.findUnique({
      where: { schoolId: student.schoolId },
    });

    const merchantId = useGlobalOnly
      ? (globalHyperpgMerchantId?.trim() ?? "")
      : (settings?.hyperpgMerchantId?.trim() || globalHyperpgMerchantId?.trim());
    const apiKey = useGlobalOnly
      ? (globalHyperpgApiKey?.trim() ?? "")
      : (settings?.hyperpgApiKey?.trim() || globalHyperpgApiKey?.trim());

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Payment not configured for this school. School admin must add HyperPG API Key in School Settings (or set HYPERPG_API_KEY in .env for fallback).",
        },
        { status: 500 }
      );
    }
    const orderId = generateOrderId();
    const baseUrl =
      process.env.HYPERPG_RETURN_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";
    const path = returnPath.startsWith("/") ? returnPath : `/${returnPath}`;
    const pathOnly = path.split("?")[0].replace(/\/$/, "") || "/payments";
    const returnUrl = `${baseUrl.replace(/\/$/, "")}${pathOnly}`;

    const nameParts = (student.user?.name || student.fatherName || "Student")
      .trim()
      .split(/\s+/);
    const firstName = (nameParts[0] || "Student").replace(/[^a-zA-Z0-9().\-_\s]/g, "").slice(0, 255);
    const lastName = nameParts
      .slice(1)
      .join(" ")
      .replace(/[^a-zA-Z0-9().\-_\s]/g, "")
      .slice(0, 255) || ".";

    const phone = (student.phoneNo || "9999999999").replace(/\D/g, "").slice(0, 10) || "9999999999";
    const email = (session.user.email || student.user?.email || "student@timelly.in").slice(0, 300);
    const customerId = String(session.user.studentId).slice(0, 128);

    const sessionPayload: Record<string, unknown> = {
      mobile_country_code: "+91",
      payment_page_client_id: hyperpgClientId,
      amount: Number(amountNumber.toFixed(2)),
      currency: "INR",
      action: "paymentPage",
      customer_email: email,
      customer_phone: phone,
      first_name: firstName,
      last_name: lastName,
      description: eventRegistrationId ? "Workshop payment - Timelly" : "Fee payment - Timelly",
      customer_id: customerId,
      order_id: orderId,
      return_url: "http://hyperpg.in/",
      send_mail: false,
      send_sms: false,
      send_whatsapp: false,
    };
    const expiryMins = process.env.HYPERPG_LINK_EXPIRY_MINS;
    if (expiryMins) sessionPayload["metadata.expiryInMins"] = String(expiryMins);
    const apiKeyClean = apiKey.replace(/^["']|["']$/g, "").trim();
    const merchantIdClean = (merchantId || "").trim().replace(/^["']|["']$/g, "");
    
    const auth =
      hyperpgAuthStyle === "merchant_key" && merchantIdClean
        ? Buffer.from(`${merchantIdClean}:${apiKeyClean}`).toString("base64")
        : Buffer.from(apiKeyClean, "utf8").toString("base64");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    };
    if (merchantIdClean && hyperpgAuthStyle === "merchant_key") {
      headers["x-merchantid"] = merchantIdClean;
    }
    const res = await fetch(`${hyperpgBaseUrl}/session`, {
      method: "POST",
      headers,
      body: JSON.stringify(sessionPayload),
      
    });

    const errText = await res.text();
    if (!res.ok) {
      console.error("HyperPG session error:", res.status, errText);
      console.error("HyperPG request URL:", hyperpgBaseUrl + "/session");
      console.error("HyperPG auth style:", hyperpgAuthStyle, "Authorization length:", headers.Authorization?.length ?? 0);
      let details = errText.slice(0, 500);
      try {
        const j = JSON.parse(errText) as Record<string, unknown>;
        if (j && typeof j.error_message === "string") details = j.error_message;
        else if (j && typeof j.error_code === "string") details = j.error_code;
        else if (j && typeof j.message === "string") details = j.message;
      } catch (_) {}
      const hint =
        res.status === 403 || res.status === 401
          ? " Confirm with HyperPG: (1) This Merchant ID and API Key are for the correct account (e.g. school linked to your email). (2) HYPERPG_MERCHANT_ID and HYPERPG_API_KEY in .env match the credentials that work in Postman. (3) If they use whitelisting, your server IP or domain may need to be whitelisted."
          : "";
      return NextResponse.json(
        {
          error: "Payment gateway error",
          details: details + hint,
          statusFromGateway: res.status,
        },
        { status: 500 }
      );
    }

    let data: { payment_links?: { web?: string }; id?: string };
    try {
      data = JSON.parse(errText);
    } catch {
      return NextResponse.json(
        { error: "Invalid response from payment gateway" },
        { status: 500 }
      );
    }

    const paymentUrl =
      data.payment_links?.web ||
      (data.payment_links as Record<string, string> | undefined)?.payment_page ||
      null;

    if (!paymentUrl) {
      console.error("HyperPG response missing payment_links.web:", data);
      return NextResponse.json(
        { error: "Payment gateway did not return payment URL" },
        { status: 500 }
      );
    }

    // Store Payment in DB (status PENDING) - will be updated on verify
    await prisma.payment.create({
      data: {
        studentId: session.user.studentId,
        amount: amountNumber,
        gateway: "HYPERPG",
        hyperpgOrderId: data.id || null,
        status: "PENDING",
        transactionId: orderId,
        ...(eventRegistrationId && { eventRegistrationId }),
      } as Prisma.PaymentUncheckedCreateInput,
    });

    return NextResponse.json({
      gateway: "HYPERPG",
      id: data.id || orderId,
      order_id: orderId,
      hyperpg_order_id: data.id || null,
      amount: amountNumber,
      payment_url: paymentUrl,
    });
  } catch (err: unknown) {
    console.error("Order creation error:", err);
    return NextResponse.json(
      {
        error: "Failed to create order",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
