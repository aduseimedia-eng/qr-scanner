# Stripe Payment Integration Setup

## Overview
Your QR Code Generator now includes a **Premium Feature** that requires payment via Stripe for logo embedding functionality.

## Features
- **Free Tier**: Generate QR codes with URL, Text, and Contact information
- **Premium Tier** ($4.99): Unlock the ability to add custom logos to QR codes

## Stripe Setup Instructions

### 1. Get Your Stripe API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up or log in to your Stripe account
3. Navigate to **Developers** → **API Keys**
4. Copy your:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)

### 2. Set Up Backend (Node.js + Express)

Create a `server.js` file in your project root:

```javascript
const express = require('express');
const stripe = require('stripe')('your_stripe_secret_key');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Create Stripe Checkout Session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'QR Code Premium - Logo Feature',
              description: 'Embed custom logos in QR codes',
            },
            unit_amount: 499, // $4.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:5173?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:5173',
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));
```

### 3. Install Backend Dependencies

```bash
npm install express stripe cors
```

### 4. Run Your Backend Server

```bash
node server.js
```

The server will run on `http://localhost:3001`

### 5. Update Frontend (Optional)

To integrate the actual Stripe checkout modal, wrap your app with `Elements`:

```javascript
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('your_stripe_publishable_key');

function App() {
  return (
    <Elements stripe={stripePromise}>
      <QRCodeGenerator />
    </Elements>
  );
}
```

### 6. Environment Variables

Create a `.env` file in your project root:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_STRIPE_SECRET_KEY=sk_test_your_key_here
```

## Current Implementation

The app includes a **simulated payment modal** that:
- ✅ Shows a premium upgrade prompt
- ✅ Displays pricing ($4.99)
- ✅ Has an "Unlock Premium" button
- ✅ Simulates successful payment (sets `isPremium = true`)

## Next Steps

To go **live**:

1. **Get Production Keys** from Stripe Dashboard
2. **Deploy Backend** (Heroku, AWS, Vercel, etc.)
3. **Update Frontend API URL** from `localhost:3001` to your production backend
4. **Add SSL/HTTPS** (required by Stripe)
5. **Test Payment Flow** in Stripe's test mode

## Stripe Test Cards

For testing:
- **Visa**: `4242 4242 4242 4242`
- **Mastercard**: `5555 5555 5555 4444`
- **Expiry**: Any future date
- **CVC**: Any 3 digits

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe React Integration](https://stripe.com/docs/stripe-js/react)
- Contact Adusei Media for custom integration support

---

**Powered by Adusei Media**
