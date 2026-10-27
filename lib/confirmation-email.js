'use strict';

/**
 * The order confirmation sent after a €32 six-issue subscription is bought.
 *
 * Shared by the Stripe webhook (api/stripe-webhook.js) and the backfill script
 * (scripts/send-confirmations.js) so past and future buyers get the same mail.
 *
 * Delivery is digital: both issues are linked as downloads rather than
 * attached. Issue 1 alone is 27MB, past Gmail's 25MB ceiling, so attaching
 * both would bounce for a large share of recipients.
 */

const SITE_URL = (process.env.SITE_URL || 'https://ftbb.ie').replace(/\/$/, '');
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'info@ftbb.ie';

const NAVY = '#0d1f3c';
const GOLD = '#c5892a';
const INK = '#0a0a0a';
const BODY = '#444444';
const MUTED = '#8a8a8a';
const LINE = '#e4e4e4';

const ISSUES = [
  {
    name: "Latest Edition - 2026",
    detail: '134 pages - current issue',
    href: 'https://heyzine.com/flip-book/af50394a66.html',
  },
  {
    name: 'Issue 1 - The First Edition',
    detail: '121 pages - back issue',
    href: SITE_URL + '/FTBB_Guide_Digital.pdf',
  },
];

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function formatAmount(amountMinor, currency) {
  if (typeof amountMinor !== 'number') return null;
  const code = (currency || 'eur').toUpperCase();
  const value = (amountMinor / 100).toFixed(2);
  return code === 'EUR' ? '€' + value : value + ' ' + code;
}

function formatDate(epochSeconds) {
  const d = epochSeconds ? new Date(epochSeconds * 1000) : new Date();
  return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * @param {object} order
 * @param {string} [order.name]         buyer's name, if Stripe captured one
 * @param {string} [order.reference]    short order reference shown on the receipt
 * @param {number} [order.amountMinor]  amount in cents
 * @param {string} [order.currency]
 * @param {number} [order.created]      unix seconds
 * @param {string} [order.description]  what was bought
 * @param {string} [order.receiptUrl]   Stripe-hosted receipt
 */
function buildOrder(order) {
  const o = order || {};
  return {
    name: o.name || '',
    reference: o.reference || '',
    amount: formatAmount(o.amountMinor, o.currency),
    date: formatDate(o.created),
    description: o.description || 'FTBB Magazine — 6-issue subscription',
    receiptUrl: o.receiptUrl || '',
    readUrl: SITE_URL + '/order-confirmed',
  };
}

function subject() {
  return 'Your FTBB subscription is confirmed - the latest edition is ready to read';
}

function html(order) {
  const o = buildOrder(order);
  const greeting = o.name ? 'Hi ' + escapeHtml(o.name.split(' ')[0]) + ',' : 'Hi there,';

  const receiptRows = [
    ['Order', o.reference],
    ['Date', o.date],
    ['Item', o.description],
    ['Total paid', o.amount],
  ]
    .filter(function (r) { return r[1]; })
    .map(function (r) {
      return (
        '<tr>' +
        '<td style="padding:7px 0;font-size:13px;color:' + MUTED + ';">' + escapeHtml(r[0]) + '</td>' +
        '<td style="padding:7px 0;font-size:13px;color:' + INK + ';font-weight:600;text-align:right;">' + escapeHtml(r[1]) + '</td>' +
        '</tr>'
      );
    })
    .join('');

  const downloads = ISSUES.map(function (issue) {
    return (
      '<tr><td style="padding:0 0 10px 0;">' +
      '<a href="' + issue.href + '" style="display:block;padding:14px 18px;border:1px solid ' + LINE + ';text-decoration:none;">' +
      '<span style="display:block;font-size:14px;font-weight:600;color:' + INK + ';">' + escapeHtml(issue.name) + '</span>' +
      '<span style="display:block;font-size:12px;color:' + MUTED + ';margin-top:3px;">' + escapeHtml(issue.detail) + ' &middot; download PDF</span>' +
      '</a></td></tr>'
    );
  }).join('');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(subject())}</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your six-issue subscription is confirmed. Read the latest edition now, plus the full first edition.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border:1px solid ${LINE};">

  <tr><td style="background:${NAVY};padding:26px 32px;">
    <span style="font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;color:#ffffff;letter-spacing:0.02em;">First Time Buyer's Bible</span>
    <span style="display:block;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${GOLD};margin-top:5px;">Order Confirmed</span>
  </td></tr>

  <tr><td style="padding:32px 32px 0 32px;font-family:Helvetica,Arial,sans-serif;">
    <p style="margin:0 0 14px 0;font-size:15px;color:${INK};">${greeting}</p>
    <h1 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.25;color:${INK};font-weight:700;">Thank you — your subscription is confirmed.</h1>
    <p style="margin:0 0 22px 0;font-size:14px;line-height:1.65;color:${BODY};">
      You now have all six issues of the First Time Buyer's Bible. The latest edition is out now and ready to read. The remaining issues will be emailed to you as each one publishes.
    </p>
  </td></tr>

  <tr><td style="padding:0 32px;">
    <a href="${o.readUrl}" style="display:block;padding:15px 20px;background:${INK};color:#ffffff;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-align:center;">Read Latest Edition Now</a>
    <p style="margin:10px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:${MUTED};text-align:center;">
      Or paste this into your browser: <a href="${o.readUrl}" style="color:${GOLD};">${o.readUrl}</a>
    </p>
  </td></tr>

  <tr><td style="padding:28px 32px 0 32px;font-family:Helvetica,Arial,sans-serif;">
    <p style="margin:0 0 12px 0;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">Download your issues</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${downloads}</table>
    <p style="margin:2px 0 0 0;font-size:11px;line-height:1.6;color:${MUTED};">Save these to your device to read offline. The links stay live — keep this email.</p>
  </td></tr>

  ${receiptRows ? `<tr><td style="padding:28px 32px 0 32px;font-family:Helvetica,Arial,sans-serif;">
    <p style="margin:0 0 6px 0;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">Receipt</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};">${receiptRows}</table>
    ${o.receiptUrl ? `<p style="margin:12px 0 0 0;font-size:12px;"><a href="${o.receiptUrl}" style="color:${GOLD};">View your full receipt from Stripe</a></p>` : ''}
  </td></tr>` : ''}

  <tr><td style="padding:28px 32px 32px 32px;font-family:Helvetica,Arial,sans-serif;">
    <div style="border-top:1px solid ${LINE};padding-top:18px;">
      <p style="margin:0 0 6px 0;font-size:13px;color:${BODY};line-height:1.65;">
        Something not working? Just reply to this email, or write to
        <a href="mailto:${SUPPORT_EMAIL}" style="color:${GOLD};">${SUPPORT_EMAIL}</a> — a real person reads it.
      </p>
    </div>
  </td></tr>

  <tr><td style="background:#fafafa;padding:20px 32px;border-top:1px solid ${LINE};font-family:Helvetica,Arial,sans-serif;">
    <p style="margin:0;font-size:11px;line-height:1.7;color:${MUTED};">
      First Time Buyers Bible Ireland Ltd &middot; 57 Clontarf Road, Dublin 3<br />
      <a href="mailto:${SUPPORT_EMAIL}" style="color:${MUTED};">${SUPPORT_EMAIL}</a> &middot;
      <a href="tel:+35318537360" style="color:${MUTED};">01 8537360</a> &middot;
      <a href="${SITE_URL}" style="color:${MUTED};">ftbb.ie</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

function text(order) {
  const o = buildOrder(order);
  const lines = [
    o.name ? 'Hi ' + o.name.split(' ')[0] + ',' : 'Hi there,',
    '',
    'Thank you - your subscription is confirmed.',
    '',
    "You now have all six issues of the First Time Buyer's Bible. The latest edition is out now and ready to read.",
    'The remaining issues',
    'will be emailed to you as each one publishes.',
    '',
    'READ LATEST EDITION NOW',
    o.readUrl,
    '',
    'DOWNLOAD YOUR ISSUES',
  ];
  ISSUES.forEach(function (i) { lines.push('- ' + i.name + ' (' + i.detail + '): ' + i.href); });

  const receipt = [
    ['Order', o.reference],
    ['Date', o.date],
    ['Item', o.description],
    ['Total paid', o.amount],
  ].filter(function (r) { return r[1]; });

  if (receipt.length) {
    lines.push('', 'RECEIPT');
    receipt.forEach(function (r) { lines.push(r[0] + ': ' + r[1]); });
    if (o.receiptUrl) lines.push('Full receipt: ' + o.receiptUrl);
  }

  lines.push(
    '',
    'Something not working? Reply to this email or write to ' + SUPPORT_EMAIL + '.',
    '',
    'First Time Buyers Bible Ireland Ltd, 57 Clontarf Road, Dublin 3',
    SUPPORT_EMAIL + ' | 01 8537360 | ' + SITE_URL
  );
  return lines.join('\n');
}

module.exports = { subject, html, text, SITE_URL, SUPPORT_EMAIL, ISSUES };
