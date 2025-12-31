"use client";

import { getBookingDetails } from "@/actions/booking.actions";
import { getOrderDetails } from "@/actions/payment.actions";
import Loading from "@/components/Loading";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Payment = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [booking, setBooking] = useState<any | null>(null);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) router.replace("/");

    const fetchOrderAndBookingDetails = async () => {
      try {
        const orderDetails = await getOrderDetails(orderId as string);
        const bookingDetails = await getBookingDetails(orderId as string);
        setBooking(bookingDetails);
        setLoading(false);
        initiatePayment(orderDetails);
      } catch (err) {
        throw new Error("Something went wrong");
      } finally {
      }
    };

    fetchOrderAndBookingDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const initiatePayment = (order: any) => {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount * 100,
      currency: order.currency,
      name: "MuseoBot",
      description: "Order Payment",
      order_id: order.id,
      handler: function (response: any) {
        // Handle payment success here
        console.log("Payment Success:", response);
        window.close();
      },
      prefill: {
        name: booking?.bookedBy || "Customer Name",
        email: booking?.email || "customer@example.com",
        contact: booking?.phone || "not provided",
      },
      theme: {
        color: "#F37254",
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.on("payment.failed", function (res: any) {
      setError(res.error.description);
    });
    paymentObject.open();
  };

  return (
    <div>
      <>
        <Script
          id="razorpay-checkout-js"
          src="https://checkout.razorpay.com/v1/checkout.js"
        />
      </>
      {loading && (
        <div className="flex h-screen items-center justify-center">
          <Loading />
        </div>
      )}
      {error && <h2> {error} </h2>}
    </div>
  );
};

export default Payment;
