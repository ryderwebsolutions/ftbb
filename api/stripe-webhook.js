const Stripe = require('stripe');
const { Resend } = require('resend');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

const SITE_URL = process.env.SITE_URL || 'https://ftbb.ie';
const FROM_EMAIL = process.env.FROM_EMAIL || 'FTBB <onboarding@resend.dev>';

module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function confirmationEmailHtml() {
  const link = `${SITE_URL}/order-confirmed`;
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;color:#0a0a0a;">
      <h1 style="font-size:20px;margin-bottom:12px;">Thank you for your purchase</h1>
      <p style="font-size:15px;line-height:1.6;color:#333;">
        Your copy of the First Time Buyer's Bible is ready. Click below to read it online or download the PDF.
      </p>
      <p style="margin:24px 0;">
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">
          Read Your Guide
        </a>
      </p>
      <p style="font-size:13px;color:#666;">
        Or copy this link: <a href="${link}" style="color:#c5892a;">${link}</a>
      </p>
      <p style="font-size:12px;color:#999;margin-top:32px;">
        Trouble accessing your guide? Contact <a href="mailto:info@ftbb.ie" style="color:#c5892a;">info@ftbb.ie</a>.
      </p>
    </div>
  `;
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details && session.customer_details.email;

    if (email) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: 'Your FTBB Guide is ready',
          html: confirmationEmailHtml(),
        });
      } catch (err) {
        console.error('Failed to send order confirmation email:', err);
      }
    }
  }

  res.status(200).json({ received: true });
};
