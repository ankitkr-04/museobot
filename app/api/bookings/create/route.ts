import prisma from "@/lib/prisma"; 
import { razorpay } from "@/lib/razorpay";
import { NextRequest, NextResponse } from "next/server";

// Initialize Razorpay with your keys

export async function POST(req: NextRequest) {
  try {
    const body: BookingRequest = await req.json();
    const museum = body.results.data[0];
    // console.log(body);

    // Calculate total price
    const totalPrice =
      body.adult_ticket * museum.adultCost +
      (body.with_accessories ? museum.accessoryCost : 0);

    // Create the booking in the database
    const newBooking = await prisma.booking.create({
      data: {
        conversationId: body.conversationId,
        museumId: museum.id,
        numOfAdults: body.adult_ticket,
        numOfChildren: 0,
        numOfSeniors: 0,
        accessories: body.with_accessories ? 1 : 0,
        totalPrice,
        visitDate: new Date(body.user_visitDate),
        bookedBy: body.user_name,
        email: body.user_email,
        status: "PENDING",
        orderId: "",
        paymentChannel: "RAZORPAY",
      },
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: totalPrice * 100,
      currency: "INR",
      receipt: newBooking.id,
      payment_capture: true,
    });

    // Update the booking with Razorpay order ID
    await prisma.booking.update({
      where: { id: newBooking.id },
      data: { orderId: razorpayOrder.id },
    });

    return NextResponse.json({
      success: true,
      orderDetails: {
        // key: process.env.RAZORPAY_KEY_ID,
        amount: totalPrice,
        currency: "INR",
        order_id: razorpayOrder.id,
        // name: museum.name,
        description: `Booking for ${museum.name}`,
        // prefill: {
        //   name: body.user_name,
        //   email: body.user_email,
        // },
        payment_url: `${process.env.BASE_URL}/payment?orderId=${razorpayOrder.id}`,
        // callback_url: process.env.RAZORPAY_CALLBACK_URL, // e.g. https://your-domain.com/api/payment/callback
      },
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json<BookingResponse>({
      success: false,
      error: "Error creating booking",
    });
  }
}
