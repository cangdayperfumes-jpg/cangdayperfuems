import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface OrderConfirmationEmailProps {
  customerName: string;
  orderId: string;
}

export const OrderConfirmationEmail = ({
  customerName,
  orderId,
}: OrderConfirmationEmailProps) => {
  return (
    <Html>
      <Head>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500&display=swap');
          `}
        </style>
      </Head>
      <Preview>Thank you for your order from Royal Perfumes.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={logo}>Royal Perfumes</Heading>
          </Section>
          
          <Section style={contentSection}>
            <Heading style={heading}>Order Received.</Heading>
            <Text style={text}>Dear {customerName},</Text>
            <Text style={text}>
              Thank you for your order. We are currently reviewing your request for Order #{orderId.slice(0, 8)}.
            </Text>
            <Text style={text}>
              We will be in touch shortly to coordinate shipping and payment via WhatsApp.
            </Text>
            
            <div style={footerDivider} />
            <Text style={footerText}>
              Exquisite scents for the modern aristocracy.<br/>
              © {new Date().getFullYear()} Royal Perfumes. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Inter', sans-serif",
  padding: '40px 0',
};

const container = {
  margin: '0 auto',
  width: '100%',
  maxWidth: '600px',
  border: '1px solid #eaeaea',
  backgroundColor: '#ffffff',
};

const headerSection = {
  padding: '32px 48px',
  backgroundColor: '#000000',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0',
  fontFamily: "'Playfair Display', serif",
  fontSize: '28px',
  fontWeight: '500',
  color: '#ffffff',
  letterSpacing: '0.05em',
};

const contentSection = {
  padding: '48px',
};

const heading = {
  margin: '0 0 24px',
  fontFamily: "'Playfair Display', serif",
  fontSize: '24px',
  fontWeight: '400',
  color: '#000000',
};

const text = {
  margin: '0 0 16px',
  fontSize: '15px',
  lineHeight: '24px',
  fontWeight: '300',
  color: '#333333',
};

const footerDivider = {
  marginTop: '48px',
  marginBottom: '24px',
  borderTop: '1px solid #eaeaea',
};

const footerText = {
  margin: '0',
  fontSize: '12px',
  lineHeight: '20px',
  color: '#999999',
  textAlign: 'center' as const,
};
