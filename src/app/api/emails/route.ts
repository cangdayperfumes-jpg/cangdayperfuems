import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/components';
import OrderConfirmationEmail from '@/components/emails/OrderConfirmationEmail';
import OrderAcceptedEmail from '@/components/emails/OrderAcceptedEmail';

// Note: No Next.js Edge runtime declarations are used here to guarantee Netlify compatibility.

export async function POST(req: Request) {
  // Without a key the Resend constructor throws. Skip cleanly instead, so a
  // missing env var shows up as one clear log line (the order itself is
  // already saved — checkout treats email as non-fatal).
  if (!process.env.RESEND_API_KEY) {
    console.warn('[emails] RESEND_API_KEY is not set — skipping order email.');
    return NextResponse.json({ skipped: true, reason: 'Email service not configured' }, { status: 503 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const body = await req.json();
    const { type, email, orderId, customerName } = body;

    // Validate request
    if (!type || !email || !orderId || !customerName) {
      return NextResponse.json(
        { error: 'Missing required fields: type, email, orderId, or customerName' },
        { status: 400 }
      );
    }

    let reactEmailTemplate;
    let subjectLine = '';

    // Determine template based on type
    if (type === 'confirmation') {
      subjectLine = 'Cangday: Order Received';
      reactEmailTemplate = OrderConfirmationEmail({ customerName, orderId });
    } else if (type === 'accepted') {
      subjectLine = 'Cangday: Order Accepted & Ready for Shipment';
      reactEmailTemplate = OrderAcceptedEmail({ customerName, orderId });
    } else {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    // Render email to HTML string first
    const emailHtml = await render(reactEmailTemplate);

    // Sender comes from EMAIL_FROM (e.g. "Cangday <orders@cangdayperfume.com>")
    // once the domain is verified in Resend. Until then Resend's shared test
    // sender is the only allowed one — and it only delivers to the Resend
    // account owner's own inbox, not to customers.
    const from = process.env.EMAIL_FROM || 'Cangday <onboarding@resend.dev>';
    const replyTo = process.env.EMAIL_REPLY_TO;

    // The Resend SDK reports failures (unverified domain, recipient not
    // allowed, bad key…) in `error` instead of throwing — check it, or a
    // rejected email would be reported back as a success.
    const { data, error } = await resend.emails.send({
      from,
      to: [email],
      subject: subjectLine,
      html: emailHtml,
      ...(replyTo ? { replyTo } : {}),
    });

    if (error) {
      console.error('Resend rejected email:', error);
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
