import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/components';
import OrderConfirmationEmail from '@/components/emails/OrderConfirmationEmail';
import OrderAcceptedEmail from '@/components/emails/OrderAcceptedEmail';

// Note: No Next.js Edge runtime declarations are used here to guarantee Netlify compatibility.

export async function POST(req: Request) {
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
      subjectLine = 'Royal Perfumes: Order Received';
      reactEmailTemplate = OrderConfirmationEmail({ customerName, orderId });
    } else if (type === 'accepted') {
      subjectLine = 'Royal Perfumes: Order Accepted & Ready for Shipment';
      reactEmailTemplate = OrderAcceptedEmail({ customerName, orderId });
    } else {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    // Render email to HTML string first
    const emailHtml = await render(reactEmailTemplate);

    // Send the email
    const data = await resend.emails.send({
      from: 'Royal Perfumes <onboarding@resend.dev>', // If unverified domain; otherwise update to actual domain
      to: [email],
      subject: subjectLine,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
