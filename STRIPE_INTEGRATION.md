# Stripe Payment Integration Guide

## Overview

This guide walks you through setting up Stripe payments in your concert ticket booking application. The integration handles credit card payments securely using Stripe's Payment Intents API.

## Setup Steps

### 1. Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up or log in to your account
3. Navigate to **Developers** → **API Keys**
4. Copy your **Publishable Key** (starts with `pk_test_`)
5. Copy your **Secret Key** (starts with `sk_test_`)

### 2. Update Environment Variables

Edit `.env.local` and add your Stripe keys:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_test_your_webhook_secret_here
```

**Important:**

- `NEXT_PUBLIC_` variables are exposed to the browser (use the Publishable Key)
- Secret keys stay on the server and are never exposed

### 3. Install Dependencies

The following packages have been added to your project:

- `stripe` - Stripe server SDK
- `@stripe/react-stripe-js` - React components for Stripe
- `@stripe/stripe-js` - Stripe client SDK

If they're not installed, run:

```bash
npm install stripe @stripe/react-stripe-js @stripe/stripe-js
```

## File Structure

```
app/
├── (main)/
│   └── checkout/
│       ├── layout.tsx          # Stripe Elements Provider
│       └── page.tsx            # Checkout page with payment form
├── api/
│   ├── orders/
│   │   └── route.ts            # Payment Intent creation
│   └── webhooks/
│       └── stripe/
│           └── route.ts        # Webhook handler for payment events
└── lib/
    └── StripePaymentForm.tsx   # Reusable payment form component
```

## How It Works

### Payment Flow

1. **User Submits Order**
   - User fills in buyer info, selects ticket tiers, and enters payment details
   - Frontend calls `/api/orders` to create a Payment Intent

2. **Payment Intent Creation**
   - Backend creates a Stripe Payment Intent with the order amount
   - Returns `clientSecret` to the frontend

3. **Card Confirmation**
   - Frontend confirms payment with Stripe using the card details from CardElement
   - Stripe processes the payment securely

4. **Payment Result**
   - On success: Order is stored and user is redirected to receipt page
   - On failure: User sees an error message and can retry

5. **Webhook Events** (Optional - Production)
   - Stripe sends webhook events to `/api/webhooks/stripe`
   - Handles payment success, failure, and refund events

### Component: `StripeCardFieldsComponent`

This custom component renders Stripe's CardElement within your form:

```typescript
<StripeCardFieldsComponent
  setCardComplete={setCardComplete}
/>
```

The CardElement handles:

- Card number validation
- Expiry date & CVC input
- PCI compliance (no sensitive data touches your server)

## Testing

### Test Cards

Use these cards to test your integration:

**Successful Payment:**

- Number: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/26)
- CVC: Any 3 digits (e.g., 123)

**Payment Declined:**

- Number: `4000 0000 0000 0002`
- Expiry: Any future date
- CVC: Any 3 digits

**Requires Authentication:**

- Number: `4000 2500 0000 0002`
- Expiry: Any future date
- CVC: Any 3 digits

### Testing in Development

1. Start your dev server: `npm run dev`
2. Go to `/checkout`
3. Fill in order details
4. Use a test card number above
5. Submit the order
6. Check the console for payment intent details

## API Endpoints

### `POST /api/orders`

Creates a Stripe Payment Intent.

**Request:**

```json
{
  "amount": 99.99,
  "currency": "cad",
  "orderId": "BP-1234567890",
  "customer_email": "customer@example.com",
  "metadata": {
    "orderId": "BP-1234567890",
    "eventNames": "Concert Event 2025"
  }
}
```

**Response:**

```json
{
  "clientSecret": "pi_test_secret_...",
  "paymentIntentId": "pi_test_..."
}
```

### `POST /api/webhooks/stripe`

Handles Stripe webhook events (for production).

**Events handled:**

- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Refund was processed

## Production Checklist

Before going live with real payments:

- [ ] Switch to live API keys from Stripe Dashboard
- [ ] Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`
- [ ] Get your webhook signing secret and add to `STRIPE_WEBHOOK_SECRET`
- [ ] Set up webhook endpoint in [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
  - Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
  - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- [ ] Test with real payment method (small transaction)
- [ ] Implement order confirmation email (currently in TODO)
- [ ] Implement ticket generation and delivery (currently in TODO)
- [ ] Set up proper error handling and logging
- [ ] Enable HTTPS on your domain
- [ ] Review security best practices from [Stripe docs](https://stripe.com/docs/security)

## Error Handling

The integration handles several error scenarios:

1. **Stripe not loaded** - Shows alert to user
2. **Payment Intent creation fails** - Shows error message
3. **Card validation fails** - Form shows validation error
4. **Payment declined** - Shows Stripe error message
5. **Network errors** - Shows generic error message

## Security Features

✅ **PCI Compliance**

- Card data never touches your server
- Stripe handles all sensitive information

✅ **HTTPS Required**

- Stripe SDK only loads over HTTPS (automatically in production)

✅ **Server-side Validation**

- All payment parameters validated on backend

✅ **Webhook Verification**

- Webhook signatures verified using secret key

## Troubleshooting

### "Stripe not loaded"

- Check that `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set in `.env.local`
- Verify you're on HTTPS (or localhost for development)

### "Invalid API Key"

- Ensure you copied the correct Publishable Key
- Check that it starts with `pk_test_` or `pk_live_`

### Card details not appearing

- Confirm Stripe dependencies are installed
- Check browser console for errors
- Verify Stripe Elements is properly initialized

### Test card denied

- Use the correct test card numbers from the Testing section
- Make sure expiry date is in the future

## Next Steps

1. **Customize Order Model** - Add Stripe payment details to your database
2. **Send Confirmation Emails** - Implement email notifications
3. **Generate Tickets** - Create PDF tickets with QR codes
4. **Set Up Webhooks** - Handle async payment events
5. **Add Refund Logic** - Implement refund processing
6. **Analytics** - Track payment metrics and conversion rates

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [React Stripe.js Guide](https://stripe.com/docs/stripe-js/react)
- [Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Testing & Debugging](https://stripe.com/docs/testing)
