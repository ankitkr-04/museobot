// app/api/create-order/route.ts
import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = "INR", receipt } = body;

    if (!amount || typeof amount !== "number") {
      return NextResponse.json(
        { error: "amount (in paise) is required" },
        { status: 400 }
      );
    }

    const opts: any = {
      amount, // amount in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(opts);
    return NextResponse.json(order);
  } catch (err: any) {
    console.error("create-order error:", err);
    return NextResponse.json(
      { error: err?.message || "internal error" },
      { status: 500 }
    );
  }
}
