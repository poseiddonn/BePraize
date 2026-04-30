"use client";

import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { StripeCardElementChangeEvent } from "@stripe/stripe-js";

interface StripePaymentFormProps {
  amount: number;
  orderId: string;
  customerEmail: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "14px",
      color: "#f2f2f2",
      "::placeholder": {
        color: "#555",
      },
    },
    invalid: {
      color: "#e53e3e",
    },
  },
};

export function StripePaymentForm({
  amount,
  orderId,
  customerEmail,
  onSuccess,
  onError,
  isProcessing,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleCardChange = (event: StripeCardElementChangeEvent) => {
    setCardComplete(event.complete);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError("Stripe not loaded");
      return;
    }

    setProcessing(true);

    try {
      // Create payment intent
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: "cad",
          orderId,
          customer_email: customerEmail,
          metadata: {
            orderId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment intent");
      }

      const { clientSecret } = await response.json();

      // Confirm payment
      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            email: customerEmail,
          },
        },
      });

      if (paymentResult.error) {
        onError(paymentResult.error.message || "Payment failed");
        setProcessing(false);
      } else if (paymentResult.paymentIntent?.status === "succeeded") {
        onSuccess(paymentResult.paymentIntent.id);
      } else if (paymentResult.paymentIntent?.status === "requires_action") {
        onError("Payment requires additional action");
        setProcessing(false);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Payment processing failed";
      onError(errorMessage);
      setProcessing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "12px" }}
    >
      <div
        style={{
          padding: "11px 14px",
          border: "1px solid #2a2a2a",
          borderRadius: "8px",
          background: "#1a1a1a",
        }}
      >
        <CardElement
          options={CARD_ELEMENT_OPTIONS}
          onChange={handleCardChange}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || !cardComplete || processing || isProcessing}
        style={{
          padding: "12px 16px",
          background:
            cardComplete && !processing && !isProcessing
              ? "#e53e3e"
              : "#2a2a2a",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 600,
          cursor:
            cardComplete && !processing && !isProcessing
              ? "pointer"
              : "not-allowed",
          opacity: cardComplete && !processing && !isProcessing ? 1 : 0.6,
        }}
      >
        {processing || isProcessing ? "Processing..." : "Complete Payment"}
      </button>
    </form>
  );
}
