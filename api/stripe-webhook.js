const Stripe = require('stripe');
const { Resend } = require('resend');
const confirmationEmail = require('../lib/confirmation-email');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL;

module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  let event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    const session = event.data.object;
    const email =
      (session.customer_details && session.customer_details.email) || session.customer_email;

    if (session.payment_status !== 'paid') {
      res.status(200).json({ received: true, skipped: 'payment_not_paid' });
      return;
    }

    if (!email || !FROM_EMAIL || !process.env.RESEND_API_KEY) {
      console.error('Cannot send order confirmation email: missing recipient or email configuration', {
        sessionId: session.id,
        hasRecipient: Boolean(email),
        hasFromEmail: Boolean(FROM_EMAIL),
        hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
      });
      res.status(500).json({ error: 'Order confirmation email is not configured' });
      return;
    }

    const order = {
      name: session.customer_details && session.customer_details.name,
      reference: session.id ? session.id.slice(-8).toUpperCase() : '',
      amountMinor: session.amount_total,
      currency: session.currency,
      created: session.created,
      description: "FTBB Magazine — 6-issue subscription",
    };

    try {
      const { error } = await resend.emails.send(
        {
          from: FROM_EMAIL,
          to: email,
          subject: confirmationEmail.subject(),
          html: confirmationEmail.html(order),
          text: confirmationEmail.text(order),
        },
        { idempotencyKey: `ftbb-order-${session.id}` }
      );

      if (error) throw error;
    } catch (err) {
      console.error('Failed to send order confirmation email:', err);
      res.status(500).json({ error: 'Failed to send order confirmation email' });
      return;
    }
  }

  res.status(200).json({ received: true });
};
