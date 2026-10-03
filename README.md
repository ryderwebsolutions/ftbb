# ftbb

## Post-payment email setup

The Stripe webhook sends the subscription confirmation after a Checkout payment is paid. In Stripe, add a webhook endpoint at `https://ftbb.ie/api/stripe-webhook` and subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy the endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`.

In Resend, verify the `send.ftbb.ie` sending domain and create an API key. Set `RESEND_API_KEY` and `FROM_EMAIL` to that key and a verified sender address, respectively. Configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, and `FROM_EMAIL` in the Vercel project for every deployed environment. `SITE_URL` and `SUPPORT_EMAIL` are optional and default to the production site and support inbox.

The checkout payment link must collect the customer's email address. Stripe retries failed webhook deliveries; Resend idempotency prevents duplicate messages when Stripe retries the same order.